"""Compare the chart data served by the Next.js app with parity_reference.json.

Usage: uv run python3 pipeline/check_parity.py [base_url]
Default base_url is http://localhost:3000. Rates must match within 1e-9, counts exactly.
For a protected Vercel preview, save each endpoint with `vercel curl` and point base_url
at a local server that serves them, or pass a base_url that is reachable without login.
"""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
TOL = 1e-9
ref = json.loads((ROOT / "pipeline" / "parity_reference.json").read_text())


def get(path):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=120) as r:
        return json.load(r)


results = []


def record(name, max_diff, exact_ok=True):
    ok = exact_ok and max_diff <= TOL
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}  max_diff={max_diff:.3g}")


# headline counts (exact)
stats = get("/api/stats")
head_ok = all(int(stats[k]) == ref["headline"][k] for k in ("rows", "labeled", "fraud"))
record("headline counts", 0.0, head_ok)

patterns = get("/api/patterns")

# fraud rate by hour
diffs = [abs(r["fraud_rate"] - ref["fraud_rate_by_hour"][str(r["hour"])]) for r in patterns["hour"]]
record("fraud rate by hour", max(diffs), len(patterns["hour"]) == len(ref["fraud_rate_by_hour"]))

# subsector top 25 (order, names, n exact; rates within tol)
got, exp = patterns["subsector"], ref["fraud_rate_by_subsector_top25"]
same = [g["category"] for g in got] == [e["category"] for e in exp] and [int(g["n"]) for g in got] == [e["n"] for e in exp]
record("fraud rate by subsector top 25", max(abs(g["fraud_rate"] - e["fraud_rate"]) for g, e in zip(got, exp)), same)

# heatmap (Monday = 0)
gd, ed = patterns["heatmap"], ref["heatmap_dow_hour"]
md, shape_ok = 0.0, len(gd) == 7 and all(len(r) == 24 for r in gd)
for gr, er in zip(gd, ed):
    for g, e in zip(gr, er):
        if (g is None) != (e is None):
            shape_ok = False
        elif g is not None:
            md = max(md, abs(g - e))
record("hour x weekday heatmap", md, shape_ok)

# amount histogram (counts exact)
h, hr = patterns["histogram"], ref["amount_histogram"]
hist_ok = h["fraud_counts"] == hr["fraud_counts"] and h["legit_counts"] == hr["legit_counts"]
edge = max(abs(h["min"] - hr["min"]), abs(h["max"] - hr["max"]))
record("amount histogram (60 bins, counts exact)", edge, hist_ok)
if not hist_ok:
    bad = [i for i in range(60) if h["fraud_counts"][i] != hr["fraud_counts"][i] or h["legit_counts"][i] != hr["legit_counts"][i]]
    print("   differing bins:", bad)

# SHAP top 15
shap, sref = get("/api/shap"), ref["shap_top15"]
names_ok = [s["feature"] for s in shap] == [s["feature"] for s in sref]
record("SHAP top 15", max(abs(a["mean_abs_shap"] - b["mean_abs_shap"]) for a, b in zip(shap, sref)), names_ok)

sys.exit(0 if all(results) else 1)
