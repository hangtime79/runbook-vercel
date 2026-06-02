# Phase 8: Dashboard

**Load this file when:** SHAP interpretability artifacts exist and you're ready to build the Streamlit app.
**Prerequisites:** `phase_07_interpretability.md`.
**Next:** `phase_09_narrative.md`.

The dashboard is the interactive deliverable. It must be immediately useful to someone who opens it with no context beyond the tab labels.

---

## Required tabs

### Tab 1: "Key Findings"

The five (or more) non-obvious findings from Phase 5, each presented as:
- A headline that states the finding in plain language
- One to two paragraphs explaining why this matters to a fraud investigator or a business decision-maker
- An interactive chart that proves the finding with data

This tab gets shown to leadership. If it doesn't make someone want to act, it hasn't done its job.

### Tab 2: "Fraud Patterns"

Comprehensive visualizations across all fraud dimensions. Fraud rate by merchant category, hour-by-day heatmap, amount distribution overlays (fraud vs. legitimate), verification/signature effect, geographic distance patterns, velocity distributions. This tab is for the analyst who wants to explore and slice.

### Tab 3: "Detection Model"

Full model transparency:
- Performance metrics (AUC-ROC with K-Fold mean ± std, PR-AUC, accuracy at threshold)
- Global feature importance (interactive bar chart from SHAP)
- Beeswarm plot for directional detail
- Dependence plots for the top 3 features (static — SHAP's dependence API is matplotlib-only)
- Individual prediction force plots — interactive, hoverable, sortable. The user should be able to click through flagged transactions and see exactly why each was flagged.
- Multi-observation force plot — all 2,000 sampled predictions stacked into a single zoomable, sortable JavaScript force plot. This is the "portfolio view" that complements the single-transaction explanations.
- ROC and Precision-Recall curves
- Confusion matrix at the chosen threshold
- Risk score distributions (fraud vs. legitimate overlaid)
- Actionable rules table derived from findings (threshold-based rules that could be implemented in a production rules engine)

The force plots are the demo showstoppers. An investigator clicking through flagged transactions and seeing exactly why each was flagged is the moment the model becomes a tool.

### Tab 4: "Data Explorer"

Filterable transaction browser. Dropdowns for merchant category, card type, or other categoricals. Toggle for fraud/legitimate/all. Slider for amount range. Properly formatted numbers: dollar signs, percentages, reasonable decimal places. Use proper table/grid configuration — not manual string formatting.

---

## Additional tabs

If your analysis reveals something that warrants its own tab — a merchant compromise investigation view, a geographic cluster map, a temporal anomaly deep-dive — build it. The four tabs above are the floor, not the ceiling.

---

## Performance

Cache data loading and model training. Tab switches must be instant. If a computation takes more than a few seconds, run it during initial load and cache the result. Nobody should wait because they clicked a different tab.

---

**Exit criteria:** Four required tabs built, findings-driven additional tabs added if warranted, caching wired so tab switches are instant. Proceed to `phase_09_narrative.md`.
