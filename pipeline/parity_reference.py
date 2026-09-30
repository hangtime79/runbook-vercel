"""Parity oracle: reproduces the dashboard aggregations with pandas/numpy.

Reads artifacts/, writes pipeline/parity_reference.json. The Next.js app must
match this file (rates within 1e-9, counts exact).
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"

gr = pd.read_parquet(ART / "golden_record.parquet")
rows = len(gr)
labeled = gr[gr["authorized_flag"].notna()].copy()
labeled["is_fraud"] = (labeled["authorized_flag"] == 0).astype(int)
dt = pd.to_datetime(labeled["purchase_date"])
labeled["hour_of_day"] = dt.dt.hour
labeled["day_of_week"] = dt.dt.dayofweek  # Monday = 0

by_hour = labeled.groupby("hour_of_day")["is_fraud"].mean()

cat_col = "subsector_description"
by_cat = (
    labeled.groupby(cat_col)["is_fraud"]
    .agg(["mean", "size"])
    .reset_index()
    .rename(columns={"mean": "fraud_rate", "size": "n"})
    .sort_values(["fraud_rate", cat_col], ascending=[False, True])
    .head(25)
)

heat = (
    labeled.groupby(["day_of_week", "hour_of_day"])["is_fraud"]
    .mean()
    .reset_index(name="fraud_rate")
    .pivot(index="day_of_week", columns="hour_of_day", values="fraud_rate")
    .reindex(index=range(7), columns=range(24))
)

amt = labeled["purchase_amount"].astype(float)
lo, hi = float(amt.min()), float(amt.max())
edges = np.linspace(lo, hi, 61)
fraud_counts, _ = np.histogram(amt[labeled["is_fraud"] == 1], bins=edges)
legit_counts, _ = np.histogram(amt[labeled["is_fraud"] == 0], bins=edges)

# ---- Redesign additions: amount bands (findings.md Finding 2) and the Story chapters' aggregates ----
# Band edges are [lo, hi) in dollars; the first four rows are tiny (<$2) and are not charted.
AMOUNT_EDGES = [2, 5, 10, 20, 50, 100, 250, 500, 1000, None]
AMOUNT_LABELS = ["$2–$5", "$5–$10", "$10–$20", "$20–$50", "$50–$100", "$100–$250", "$250–$500", "$500–$1k", "$1k+"]
amount_bands = []
for label, lo_e, hi_e in zip(AMOUNT_LABELS, AMOUNT_EDGES[:-1], AMOUNT_EDGES[1:]):
    m = labeled["purchase_amount"] >= lo_e
    if hi_e is not None:
        m &= labeled["purchase_amount"] < hi_e
    sub = labeled[m]
    amount_bands.append({"label": label, "n": int(len(sub)), "fraud": int(sub["is_fraud"].sum()),
                         "fraud_rate": float(sub["is_fraud"].mean())})

feat = pd.read_parquet(ART / "features.parquet")
feat["is_fraud"] = (feat["authorized_flag"] == 0).astype(int)


def grouped(frame, key):
    g = frame.groupby(key)["is_fraud"].agg(["size", "sum", "mean"])
    return [{"key": k, "n": int(r["size"]), "fraud": int(r["sum"]), "fraud_rate": float(r["mean"])} for k, r in g.iterrows()]


merch = (
    labeled.groupby("merchant_id")["is_fraud"].agg(["size", "sum", "mean"]).reset_index()
    .rename(columns={"size": "n", "sum": "fraud", "mean": "fraud_rate"})
)
merch = merch[merch["n"] >= 50].sort_values(["fraud_rate", "merchant_id"], ascending=[False, True]).head(10)
sub_n = labeled.groupby(cat_col)["is_fraud"].agg(["size", "mean"]).reset_index().rename(columns={"size": "n", "mean": "fraud_rate"})
sub_n = sub_n[sub_n["n"] >= 500]
sub_hi = sub_n.sort_values(["fraud_rate", cat_col], ascending=[False, True]).head(5)
sub_lo = sub_n.sort_values(["fraud_rate", cat_col], ascending=[True, True]).head(5)
feat["velocity_capped"] = feat["velocity_1h_count"].clip(upper=4)


def flag_split(col):
    a, b = feat[feat[col] == 1], feat[feat[col] == 0]
    return {"n_flagged": int(len(a)), "rate_flagged": float(a["is_fraud"].mean()),
            "n_unflagged": int(len(b)), "rate_unflagged": float(b["is_fraud"].mean())}


both = feat[(feat["is_micro_transaction"] == 1) & (feat["velocity_above_1_per_hour"] == 1)]
story = {
    "merchants_top10": [{"merchant_id": r["merchant_id"], "n": int(r["n"]), "fraud": int(r["fraud"]),
                         "fraud_rate": float(r["fraud_rate"])} for _, r in merch.iterrows()],
    "velocity": grouped(feat, "velocity_capped"),
    "age_bucket": grouped(feat, "age_bucket"),
    "signature": grouped(labeled, "signature_provided"),
    "impossible_travel": grouped(feat, "impossible_travel_flag"),
    "subsector_top5": [{"category": r[cat_col], "n": int(r["n"]), "fraud_rate": float(r["fraud_rate"])} for _, r in sub_hi.iterrows()],
    "subsector_bottom5": [{"category": r[cat_col], "n": int(r["n"]), "fraud_rate": float(r["fraud_rate"])} for _, r in sub_lo.iterrows()],
    "triggers": {
        "is_micro_transaction": flag_split("is_micro_transaction"),
        "velocity_above_1_per_hour": flag_split("velocity_above_1_per_hour"),
        "micro_x_velocity": {"n": int(len(both)), "fraud_rate": float(both["is_fraud"].mean())},
    },
}

sh = np.load(ART / "shap_values.npz", allow_pickle=True)
mean_abs = np.abs(sh["values"]).mean(axis=0)
order = np.argsort(mean_abs)[::-1][:15]
shap_top = [
    {"feature": str(sh["feature_names"][i]), "mean_abs_shap": float(mean_abs[i])}
    for i in order
]

ref = {
    "headline": {
        "rows": int(rows),
        "labeled": int(len(labeled)),
        "fraud": int(labeled["is_fraud"].sum()),
    },
    "fraud_rate_by_hour": {str(int(h)): float(v) for h, v in by_hour.items()},
    "fraud_rate_by_subsector_top25": [
        {"category": r[cat_col], "fraud_rate": float(r["fraud_rate"]), "n": int(r["n"])}
        for _, r in by_cat.iterrows()
    ],
    "heatmap_dow_hour": [
        [None if pd.isna(v) else float(v) for v in heat.loc[d]] for d in range(7)
    ],
    "amount_histogram": {
        "min": lo,
        "max": hi,
        "bins": 60,
        "fraud_counts": [int(x) for x in fraud_counts],
        "legit_counts": [int(x) for x in legit_counts],
    },
    "shap_top15": shap_top,
    "amount_bands": amount_bands,
    "story": story,
}
(ROOT / "pipeline" / "parity_reference.json").write_text(json.dumps(ref, indent=1))
print(ref["headline"])
print("hours:", len(ref["fraud_rate_by_hour"]), "cats:", len(ref["fraud_rate_by_subsector_top25"]))
print("hist sums:", sum(fraud_counts), sum(legit_counts))
print(shap_top[:3])
