"""Copy-figure check: every number quoted in static UI copy must trace to its source.

Usage: uv run python3 pipeline/check_story_figures.py

Reads lib/copy.ts (all static editorial copy lives there) and pulls every number out of its string
literals. Each number must match, at the precision it is written in, either
  - a structured figure: pipeline/parity_reference.json (rates shown as percentages too, plus a few
    derived ratios and shares) or data/model_summary.json, compared after rounding; or
  - a number that appears exactly in the analysis documents (data/docs/findings.md, NARRATIVE.md,
    metrics.md, shap.md).
Numbers that trace to nothing are listed and the script exits 1. Live figures (KPIs, chart series,
big stats) are computed from data/ in the app and are not in copy.ts.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
copy_src = (ROOT / "lib" / "copy.ts").read_text()
ref = json.loads((ROOT / "pipeline" / "parity_reference.json").read_text())
model = json.loads((ROOT / "data" / "model_summary.json").read_text())
DOCS = ["findings.md", "NARRATIVE.md", "metrics.md", "shap.md"]

NUM = re.compile(r"(?<![A-Za-z_\d.])\d[\d,]*(?:\.\d+)?(?![A-Za-z_]|\d)|(?<![A-Za-z_\d.])\d[\d,]*(?:\.\d+)?K")


def decimals(tok: str) -> int:
    return len(tok.split(".")[1]) if "." in tok else 0


def parse(tok: str) -> float:
    return float(tok.replace(",", "").rstrip("K"))


# ---- structured corpus: (label, value) ---------------------------------------------------------
structured: list[tuple[str, float]] = []


def walk(node, path=""):
    if isinstance(node, dict):
        for k, v in node.items():
            walk(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]")
    elif isinstance(node, (int, float)) and not isinstance(node, bool):
        structured.append((path, float(node)))
        if 0 <= node <= 1:
            structured.append((path + " (as %)", float(node) * 100))


walk(ref, "parity")
walk(model, "model")
for lbl, v in list(structured):
    if lbl.startswith("model.") and 0 < v < 1 and "(as %)" not in lbl:
        pass

# Derived figures the copy states (ratios, shares, multiples of baseline).
head = ref["headline"]
baseline = head["fraud"] / head["labeled"]
story = ref["story"]
sig = {s["key"]: s for s in story["signature"]}
sig_total = sig[0]["n"] + sig[1]["n"]
derived = {
    "signature share unsigned": sig[0]["n"] / sig_total * 100,
    "signature share signed": sig[1]["n"] / sig_total * 100,
    "signature effect": sig[0]["fraud_rate"] / sig[1]["fraud_rate"],
    "fraud share (labeled) pct": baseline * 100,
    "pending rows": head["rows"] - head["labeled"],
}
mrates = [m["fraud_rate"] / baseline for m in story["merchants_top10"]]
derived["top-10 merchants: min multiple of baseline"] = min(mrates)
derived["top-10 merchants: max multiple of baseline"] = max(mrates)
v = {x["key"]: x for x in story["velocity"]}
derived["velocity 1 vs 0"] = v[1]["fraud_rate"] / v[0]["fraud_rate"]
derived["velocity tail max group size (3, 4+)"] = max(v[3]["n"], v[4]["n"])
mv = story["triggers"]["micro_x_velocity"]
derived["micro x velocity n"] = mv["n"]
derived["amount band spread (top-bottom sector)"] = (story["subsector_top5"][0]["fraud_rate"] - story["subsector_bottom5"][0]["fraud_rate"]) * 100
for lbl, val in derived.items():
    structured.append((f"derived: {lbl}", val))

# ---- document corpus: exact numbers as written -------------------------------------------------
doc_nums: dict[float, str] = {}
for name in DOCS:
    text = (ROOT / "data" / "docs" / name).read_text()
    for m in NUM.finditer(text):
        doc_nums.setdefault(parse(m.group()), name)

# ---- extract strings from lib/copy.ts ----------------------------------------------------------
EXEMPT_PREFIXES = (  # method / structural labels, not analytical claims
    "Playbook v3.2",
    "Phase 5 ·",
    "Phase 6–7",
    "Phase 9",
    "Triggers fired",
    "§6.5",
    "artifacts/",
)
strings = []
for m in re.finditer(r'"((?:[^"\\]|\\.)*)"', copy_src):
    s = m.group(1)
    if len(s) < 4 or not re.search(r"\d", s) or s.startswith(("/", "http")) or s.startswith(EXEMPT_PREFIXES):
        continue
    strings.append(s)
# Long strings are concatenated with + across lines; the regex above sees each piece, which is fine.

untraced, traced = [], 0
for s in strings:
    for m in NUM.finditer(s):
        tok = m.group()
        val, dec = parse(tok), decimals(tok)
        hit = None
        if tok.endswith("K"):
            lo = val * 1000
            hit = next((lbl for lbl, c in structured if lo <= c < lo + 1000), None)
        else:
            hit = next((lbl for lbl, c in structured if round(c, dec) == val), None)
            if hit is None and val in doc_nums:
                hit = f"docs/{doc_nums[val]}"
        if hit:
            traced += 1
        else:
            untraced.append((tok, s))

print(f"copy.ts: {len(strings)} strings with numbers; {traced} figures traced")
for tok, s in untraced:
    print(f"UNTRACED  {tok!r} in: {s[:110]}")
print("PASS" if not untraced else f"FAIL: {len(untraced)} figure(s) not traceable")
sys.exit(0 if not untraced else 1)
