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

# amount bands (findings.md Finding 2): counts exact, rates within tol
got, exp = patterns["amountBands"], ref["amount_bands"]
same = [(g["label"], int(g["n"]), int(g["fraud"])) for g in got] == [(e["label"], e["n"], e["fraud"]) for e in exp]
record("amount bands (9, counts exact)", max(abs(g["fraud_rate"] - e["fraud_rate"]) for g, e in zip(got, exp)), same)

# Overnight window (hours 2-6): counts exact, combined rate within tol
og, oe = patterns["overnight"], ref["overnight_window"]
record("overnight window 2-6 (counts exact)", abs(og["fraud_rate"] - oe["fraud_rate"]),
       (int(og["n"]), int(og["fraud"]), og["start"], og["end"]) == (oe["n"], oe["fraud"], oe["start"], oe["end"]))

# Story chapter aggregates and Findings triggers
story, sref = get("/api/story"), ref["story"]


def buckets_match(name, got_rows, exp_rows, label_key="key"):
    ok = [(g[label_key], int(g["n"]), int(g["fraud"])) for g in got_rows] == [(e[label_key], e["n"], e["fraud"]) for e in exp_rows]
    md = max(abs(g["fraud_rate"] - e["fraud_rate"]) for g, e in zip(got_rows, exp_rows)) if ok else 1.0
    record(name, md, ok)


# Top-10 merchants: ids in order, counts exact
got_m = [(m["merchant_id"], m["n"], m["fraud"]) for m in story["merchants"]]
exp_m = [(m["merchant_id"], m["n"], m["fraud"]) for m in sref["merchants_top10"]]
record("story: top 10 merchants", max(abs(g["fraud_rate"] - e["fraud_rate"]) for g, e in zip(story["merchants"], sref["merchants_top10"])), got_m == exp_m)
buckets_match("story: velocity 0..4+", story["velocity"], sref["velocity"])
buckets_match("story: age buckets", story["age"], sref["age_bucket"])
buckets_match("story: signature", story["signature"], sref["signature"])
buckets_match("story: impossible-travel flag", story["travel"], sref["impossible_travel"])
for key, ref_key in (("subsectorTop", "subsector_top5"), ("subsectorBottom", "subsector_bottom5")):
    g, e = story[key], sref[ref_key]
    record(f"story: {key}", max(abs(a["fraud_rate"] - b["fraud_rate"]) for a, b in zip(g, e)),
           [(a["category"], int(a["n"])) for a in g] == [(b["category"], b["n"]) for b in e])
tg, te = story["triggers"], sref["triggers"]
for got_key, ref_key in (("micro", "is_micro_transaction"), ("velocity", "velocity_above_1_per_hour")):
    a, b = tg[got_key], te[ref_key]
    counts = int(a["n_flagged"]) == b["n_flagged"] and int(a["n_unflagged"]) == b["n_unflagged"]
    record(f"triggers: {ref_key}", max(abs(a["rate_flagged"] - b["rate_flagged"]), abs(a["rate_unflagged"] - b["rate_unflagged"])), counts)
record("triggers: micro x velocity", abs(tg["both"]["fraud_rate"] - te["micro_x_velocity"]["fraud_rate"]),
       int(tg["both"]["n"]) == te["micro_x_velocity"]["n"])

sys.exit(0 if all(results) else 1)
