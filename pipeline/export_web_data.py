"""Export the web app's inputs from artifacts/ and NARRATIVE.md into data/.

Writes:
  data/golden_record.parquet, data/features.parquet   (copies)
  data/shap_importance.json                            (mean |SHAP|, all features, sorted)
  data/docs/{findings,metrics,shap}.md, data/docs/NARRATIVE.md

The Next.js app reads data/ only. model.pkl is never loaded.
"""
import json
import shutil
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "artifacts"
OUT = ROOT / "data"
DOCS = OUT / "docs"

required = [
    ART / "golden_record.parquet",
    ART / "features.parquet",
    ART / "shap_values.npz",
    ART / "findings.md",
    ART / "metrics.md",
    ART / "shap.md",
    ROOT / "NARRATIVE.md",
]
missing = [str(p.relative_to(ROOT)) for p in required if not p.exists() or p.stat().st_size == 0]
if missing:
    raise SystemExit(f"Missing or empty inputs: {missing}")

DOCS.mkdir(parents=True, exist_ok=True)

for name in ("golden_record.parquet", "features.parquet"):
    shutil.copyfile(ART / name, OUT / name)

for name in ("findings.md", "metrics.md", "shap.md"):
    shutil.copyfile(ART / name, DOCS / name)
shutil.copyfile(ROOT / "NARRATIVE.md", DOCS / "NARRATIVE.md")

sh = np.load(ART / "shap_values.npz", allow_pickle=True)
mean_abs = np.abs(sh["values"]).mean(axis=0)
order = np.argsort(mean_abs)[::-1]
importance = [
    {"feature": str(sh["feature_names"][i]), "mean_abs_shap": float(mean_abs[i])}
    for i in order
]
(OUT / "shap_importance.json").write_text(json.dumps(importance, indent=1))

for p in sorted(OUT.rglob("*")):
    if p.is_file():
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size:,} bytes")
