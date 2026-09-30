"""Export the web app's inputs from artifacts/ and NARRATIVE.md into data/.

Writes:
  data/golden_record.parquet, data/features.parquet   (copies)
  data/fraud.duckdb                                    (both tables; read-only query DB for /api/ask)
  data/shap_importance.json                            (mean |SHAP|, all features, sorted)
  data/explorer_rows.parquet                           (500 holdout rows scored by model.pkl)
  data/model_summary.json                              (metrics.md and shap.md figures as JSON)
  data/docs/{findings,metrics,shap,features_schema,orientation,quality}.md, data/docs/NARRATIVE.md

The Next.js app reads data/ only. model.pkl is loaded here, at export time, and never by the app.
It is our own Phase 6 artifact; nothing untrusted is ever unpickled.
"""
import json
import pickle
import re
import shutil
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
OUT = ROOT / "data"
DOCS = OUT / "docs"

DOC_NAMES = ("findings.md", "metrics.md", "shap.md", "features_schema.md", "orientation.md", "quality.md")

required = [
    ART / "golden_record.parquet",
    ART / "features.parquet",
    ART / "shap_values.npz",
    ART / "model.pkl",
    ART / "holdout_indices.npy",
    *(ART / n for n in DOC_NAMES),
    ROOT / "NARRATIVE.md",
]
missing = [str(p.relative_to(ROOT)) for p in required if not p.exists() or p.stat().st_size == 0]
if missing:
    raise SystemExit(f"Missing or empty inputs: {missing}")

DOCS.mkdir(parents=True, exist_ok=True)

for name in ("golden_record.parquet", "features.parquet"):
    shutil.copyfile(ART / name, OUT / name)

for name in DOC_NAMES:
    shutil.copyfile(ART / name, DOCS / name)
shutil.copyfile(ROOT / "NARRATIVE.md", DOCS / "NARRATIVE.md")

# Read-only query database for the "Ask the data" route. Rebuilt from scratch so it never drifts
# from the parquet copies. Opened READ_ONLY by the app; nothing in the app writes to it.
DB = OUT / "fraud.duckdb"
DB.unlink(missing_ok=True)
Path(str(DB) + ".wal").unlink(missing_ok=True)
con = duckdb.connect(str(DB))
for table in ("golden_record", "features"):
    con.execute(f"CREATE TABLE {table} AS SELECT * FROM read_parquet('{OUT / (table + '.parquet')}')")
    n = con.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
    print(f"fraud.duckdb: {table} {n:,} rows")
con.execute("CHECKPOINT")
con.close()

sh = np.load(ART / "shap_values.npz", allow_pickle=True)
mean_abs = np.abs(sh["values"]).mean(axis=0)
order = np.argsort(mean_abs)[::-1]
importance = [
    {"feature": str(sh["feature_names"][i]), "mean_abs_shap": float(mean_abs[i])}
    for i in order
]
(OUT / "shap_importance.json").write_text(json.dumps(importance, indent=1))

# ---- Explorer rows: score a holdout sample with the documented model ---------------------------
# Same labeled join and the same stratified 80/20 split as Phase 6 (random_state=42), so the rows
# below are ones the model never trained on. The model expects merchant_fraud_rate, which is not
# stored in features.parquet (Phase 6 recomputed it on the training slice): rebuild it that way.
#
# Which model: metrics.md reports Phase 6's early-stopping fit (90% of the train slice), which was
# never saved. model.pkl holds the refit on 100% of the train slice, whose holdout AUC is 0.7645,
# not the documented 0.7640. Owner decision: retrain the documented model here from the Phase 6
# recipe and seed, and require it to reproduce metrics.md before any score is shipped. model.pkl
# still supplies the feature order, the threshold and the merchant-rate map to cross-check.
SEED = 42
N_EXPLORER = 500

with open(ART / "model.pkl", "rb") as fh:
    pkg = pickle.load(fh)
feature_cols, threshold = pkg["feature_cols"], float(pkg["threshold"])

con = duckdb.connect()
df = con.execute(
    f"""
    SELECT f.*, g.merchant_id
    FROM read_parquet('{ART / "features.parquet"}') f
    JOIN read_parquet('{ART / "golden_record.parquet"}') g USING (transaction_id)
    WHERE f.authorized_flag IS NOT NULL
    """
).df()
y_all = (df["authorized_flag"].astype(int) == 0).astype(int).to_numpy()
idx_train, idx_hold = train_test_split(np.arange(len(df)), test_size=0.2, random_state=SEED, stratify=y_all)
if not np.array_equal(idx_hold, np.load(ART / "holdout_indices.npy")):
    raise SystemExit("Holdout split does not match artifacts/holdout_indices.npy; refusing to score.")

# Training-slice merchant rates; merchants with fewer than 5 training rows, and unseen ones, get
# the training baseline. Cross-check against the map Phase 6 stored in the pickle.
train = pd.DataFrame({"merchant_id": df["merchant_id"].to_numpy()[idx_train], "y": y_all[idx_train]})
baseline = float(train["y"].mean())
grp = train.groupby("merchant_id")["y"].agg(["mean", "count"])
rate_map = grp.loc[grp["count"] >= 5, "mean"].to_dict()
stored = pkg["merchant_rate_map"]
if abs(baseline - pkg["merchant_baseline_rate"]) > 1e-12 or any(
    abs(rate_map.get(m, baseline) - r) > 1e-12 for m, r in stored.items()
):
    raise SystemExit("Rebuilt merchant rates differ from the map stored in model.pkl.")

hold = df.iloc[idx_hold].reset_index(drop=True)
y_hold = y_all[idx_hold]
x_cols = [c for c in df.columns if c not in ("transaction_id", "authorized_flag", "merchant_id", "merchant_fraud_rate")]
X_hold = hold[x_cols].copy()
X_hold["merchant_fraud_rate"] = hold["merchant_id"].map(rate_map).fillna(baseline).astype(float).to_numpy()
X_hold = X_hold[feature_cols]

train_rows = df.iloc[idx_train].reset_index(drop=True)
y_train = y_all[idx_train]
X_train = train_rows[x_cols].copy()
X_train["merchant_fraud_rate"] = train_rows["merchant_id"].map(rate_map).fillna(baseline).astype(float).to_numpy()
X_train = X_train[feature_cols]
params = dict(  # Phase 6 hyperparameters (metrics.md)
    max_depth=4, learning_rate=0.1, n_estimators=300, min_child_weight=5, subsample=0.8,
    colsample_bytree=0.8, scale_pos_weight=float((y_train == 0).sum() / (y_train == 1).sum()),
    eval_metric="auc", n_jobs=-1, random_state=SEED, tree_method="hist",
)
sub_tr, sub_va = train_test_split(np.arange(len(train_rows)), test_size=0.1, random_state=SEED, stratify=y_train)
model = XGBClassifier(**params, early_stopping_rounds=30)
model.fit(X_train.iloc[sub_tr], y_train[sub_tr], eval_set=[(X_train.iloc[sub_va], y_train[sub_va])], verbose=False)
score = model.predict_proba(X_hold)[:, 1]
pkl_auc = float(roc_auc_score(y_hold, pkg["model"].predict_proba(X_hold)[:, 1]))
print(f"model.pkl holdout AUC {pkl_auc:.4f} (refit on 100% of train; not used for scores)")

# ---- Model page figures: metrics.md and shap.md as JSON -----------------------------------------
metrics_md = (ART / "metrics.md").read_text()
shap_md = (ART / "shap.md").read_text()


def grab(pattern: str, text: str = metrics_md, groups: int = 1):
    m = re.search(pattern, text)
    if not m:
        raise SystemExit(f"metrics.md/shap.md: pattern not found: {pattern}")
    vals = [float(g.replace(",", "")) for g in m.groups()]
    return vals[0] if groups == 1 else vals


doc_auc = grab(r"AUC-ROC \| \*\*([\d.]+)\*\*")
doc_pr = grab(r"PR-AUC \(avg precision\) \| \*\*([\d.]+)\*\*")
cv_auc_mean, cv_auc_std, cv_pr_mean, cv_pr_std = grab(
    r"\*\*mean ± std\*\* \| \*\*([\d.]+) ± ([\d.]+)\*\* \| \*\*([\d.]+) ± ([\d.]+)\*\*", groups=4
)
folds = [
    {"fold": int(f), "auc": float(a), "pr_auc": float(p)}
    for f, a, p in re.findall(r"^\| (\d) \| ([\d.]+) \| ([\d.]+) \|$", metrics_md, re.M)
]
thr, prec, rec = grab(r"\| ([\d.]+) \| ([\d.]+)% \| ([\d.]+)% \|", groups=3)
tn, fp = grab(r"actual_legit\s+([\d,]+)\s+([\d,]+)", groups=2)
fn, tp = grab(r"actual_fraud\s+([\d,]+)\s+([\d,]+)", groups=2)

# The acceptance check: the scores we ship must reproduce the holdout AUC in metrics.md.
auc_hold = float(roc_auc_score(y_hold, score))
print(f"holdout AUC recomputed {auc_hold:.4f} vs metrics.md {doc_auc:.4f}")
if round(auc_hold, 3) != round(doc_auc, 3):
    raise SystemExit(f"Holdout AUC mismatch ({auc_hold:.4f} vs {doc_auc:.4f}); not shipping these scores.")
if int(model.best_iteration) != int(grab(r"Best boosting round \| (\d+)")):
    raise SystemExit("Best boosting round differs from metrics.md; not shipping these scores.")
pr_hold = float(average_precision_score(y_hold, score))
cm = confusion_matrix(y_hold, (score >= threshold).astype(int))
print(f"holdout PR-AUC {pr_hold:.4f} (doc {doc_pr:.4f}); threshold {threshold:.4f} (doc {thr:.4f})")
print(f"confusion at threshold: tn={cm[0, 0]} fp={cm[0, 1]} fn={cm[1, 0]} tp={cm[1, 1]} "
      f"(doc {int(tn)} {int(fp)} {int(fn)} {int(tp)})")
if cm.tolist() != [[int(tn), int(fp)], [int(fn), int(tp)]] or round(pr_hold, 4) != round(doc_pr, 4):
    raise SystemExit("Confusion matrix or PR-AUC differs from metrics.md; not shipping these scores.")

checks = re.findall(r"\*\*Check (\d) \(([^)]*)\):\*\*\s*(.*)", metrics_md)
best_round = int(grab(r"Best boosting round \| (\d+)"))
# Check 4 has no verdict word in metrics.md; it passes when early stopping fired before the ceiling.
status = lambda line: "FLAG" if ("FLAG" in line or "FAIL" in line) else "PASS"
check4_ok = best_round < params["n_estimators"]
shap_dirs = {}
for label, direction in re.findall(r"^\| ([^|]+?) \| ([^|]+?) \| [^|]+ \|$", shap_md.split("## Directional Summary")[1].split("\n---\n")[0], re.M):
    if label not in ("Feature", "---"):
        shap_dirs[label.strip()] = direction.strip()

summary = {
    "holdout": {
        "auc": doc_auc,
        "pr_auc": doc_pr,
        "best_round": best_round,
        "max_rounds": int(params["n_estimators"]),
        "rows": int(len(y_hold)),
        "prevalence": float(y_hold.mean()),
    },
    "cv": {"auc_mean": cv_auc_mean, "auc_std": cv_auc_std, "pr_auc_mean": cv_pr_mean,
           "pr_auc_std": cv_pr_std, "folds": folds},
    "operating_point": {"threshold": thr, "precision": prec / 100, "recall": rec / 100},
    "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    "n_features": int(grab(r"\*\*Features:\*\* (\d+)")),
    "diagnostics": {
        # Playbook section 6.5 limits, echoed so the UI can say "under the 0.85 ceiling".
        "leakage_ceiling": 0.85,
        "underfit_floor": 0.62,
        "cv_std_limit": 0.05,
        "checks": [{"n": int(n), "label": lbl, "status": ("PASS" if check4_ok else "FLAG") if n == "4" else status(line)}
                   for n, lbl, line in checks],
        "overall": "PASS" if re.search(r"\*\*Overall:\*\* PASS", metrics_md) else "FLAG",
    },
    "shap_directions": shap_dirs,
}
(OUT / "model_summary.json").write_text(json.dumps(summary, indent=1))

# 500 rows: the first 500 of the seeded, shuffled holdout, so a random sample and not the highest
# scores. The UI sorts them by score. Columns the feature matrix lacks come from the golden record.
gold = con.execute(
    f"SELECT transaction_id, purchase_amount, subsector_description "
    f"FROM read_parquet('{ART / 'golden_record.parquet'}')"
).df()
sample = hold.assign(score=score).head(N_EXPLORER)
sample["merchant_fraud_rate"] = X_hold["merchant_fraud_rate"].to_numpy()[:N_EXPLORER]
explorer = sample.merge(gold, on="transaction_id", how="left", validate="one_to_one")[
    ["transaction_id", "authorized_flag", "purchase_amount", "subsector_description", "hour_of_day",
     "signature_provided", "merchant_fraud_rate", "is_micro_transaction", "velocity_above_1_per_hour",
     "score"]
].rename(columns={"hour_of_day": "hour"})
con.register("explorer", explorer)
con.execute(f"COPY (SELECT * FROM explorer) TO '{OUT / 'explorer_rows.parquet'}' (FORMAT PARQUET)")
print(f"explorer_rows.parquet: {len(explorer)} rows, {int((explorer['score'] >= threshold).sum())} at or above threshold")

for p in sorted(OUT.rglob("*")):
    if p.is_file():
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size:,} bytes")
