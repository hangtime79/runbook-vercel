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
}
(ROOT / "pipeline" / "parity_reference.json").write_text(json.dumps(ref, indent=1))
print(ref["headline"])
print("hours:", len(ref["fraud_rate_by_hour"]), "cats:", len(ref["fraud_rate_by_subsector_top25"]))
print("hist sums:", sum(fraud_counts), sum(legit_counts))
print(shap_top[:3])
