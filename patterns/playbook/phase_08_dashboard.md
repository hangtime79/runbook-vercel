# Phase 8: Dashboard

**Load this file when:** SHAP interpretability artifacts exist and you're ready to publish the dashboard. The dashboard is a Next.js app at the repo root that reads only the committed `data/` folder, exported from `artifacts/`.
**Prerequisites:** `phase_07_interpretability.md`.
**Next:** `phase_09_narrative.md`.

The dashboard is the interactive deliverable. It must be immediately useful to someone who opens it with no context beyond the nav labels.

---

## Required views

Each view is one route of the Next.js app, plus a Narrative view at `/` that renders `NARRATIVE.md`. The content requirements below are the methodology; the implementation is server components querying DuckDB over `data/*.parquet` and rendering charts with Recharts.

### View 1: "Key Findings" (`/findings`)

The five (or more) non-obvious findings from Phase 5, each presented as:
- A headline that states the finding in plain language
- One to two paragraphs explaining why this matters to a fraud investigator or a business decision-maker
- A chart that proves the finding with data

This view gets shown to leadership. If it doesn't make someone want to act, it hasn't done its job.

### View 2: "Fraud Patterns" (`/patterns`)

Comprehensive visualizations across all fraud dimensions. Fraud rate by merchant category, hour-by-day heatmap, amount distribution overlays (fraud vs. legitimate), verification/signature effect, geographic distance patterns, velocity distributions. This view is for the analyst who wants to explore and slice.

### View 3: "Detection Model" (`/model`)

Full model transparency:
- Performance metrics (AUC-ROC with K-Fold mean ± std, PR-AUC, accuracy at threshold)
- Global feature importance (bar chart from SHAP)
- Beeswarm plot for directional detail
- Dependence plots for the top 3 features (static images from `artifacts/`; SHAP's dependence API is matplotlib-only)
- ROC and Precision-Recall curves
- Confusion matrix at the chosen threshold
- Risk score distributions (fraud vs. legitimate overlaid)
- Actionable rules table derived from findings (threshold-based rules that could be implemented in a production rules engine)

### View 4: "Data Explorer" (`/explorer`)

Transaction browser. Properly formatted numbers: dollar signs, percentages, reasonable decimal places. Format in the table layer (`$` on amounts, 3 decimals on rates and `is_*` flags), not by mutating the data. Filters for merchant category, card type, fraud/legitimate and amount range are welcome additions.

---

## Additional views

If your analysis reveals something that warrants its own view — a merchant compromise investigation, a geographic cluster map, a temporal anomaly deep-dive — build it. The views above are the floor, not the ceiling.

---

## Export, build, verify

1. Run `uv run python3 pipeline/export_web_data.py`. It copies the parquet files, SHAP importances and analysis docs from `artifacts/` and `NARRATIVE.md` into the committed `data/` folder. Never regenerate artifacts here.
2. `npm install` (if `node_modules/` is missing), then `npm run build`.
3. `npm run start -- -p 3000` in the background; confirm HTTP 200 on `/`, `/findings`, `/patterns`, `/model`, `/explorer` and `/api/stats`.
4. Optional parity check: `uv run python3 pipeline/check_parity.py` compares the chart data served by the app with `pipeline/parity_reference.json`.

The Next.js app reads `data/` only. It never trains, joins or recomputes the analysis.

## Performance

Queries run server-side in DuckDB, and the instance is cached at module scope so warm requests are fast. Nobody should wait because they clicked a different view.

---

**Exit criteria:** Four required views plus the Narrative built, findings-driven additional views added if warranted, `npm run build` clean, every route returns 200. Proceed to `phase_09_narrative.md`.
