# Phase 7: Interpretability — SHAP

**Load this file when:** model is trained and diagnostic checks passed.
**Prerequisites:** `phase_06_model_building.md`.
**Next:** `phase_08_dashboard.md`. Disagreement check may send you back to `phase_06_model_building.md` or `phase_04_feature_engineering.md`.

Use SHAP (Shapley Additive Explanations). Do not use the model's built-in feature importance — it measures split frequency, which rewards high-cardinality features and doesn't capture directional impact.

---

## 7.1 Global importance

Compute SHAP values with `shap.TreeExplainer(clf)` on a stratified 2,000-row sample of the holdout test set. Computing on the full test set is wasteful — 2,000 rows is enough to stabilize the global importance ranking, and using a sample keeps the dashboard responsive. Take mean absolute SHAP values across that sample for the ranked feature list. Compare it to your Phase 5 findings — they should broadly agree. If a feature dominates in SHAP but didn't show up in your univariate cuts, it's working through interactions. If a feature dominated your univariate analysis but SHAP ranks it low, other features are capturing the same signal more efficiently.

**Disagreement check:** If the top 3 SHAP features don't overlap at all with the top 3 dimensions from your `phase_05_pattern_discovery.md` §5.1 variance ranking, investigate before proceeding. Either the model is finding interaction effects your univariate analysis missed, or there's a feature construction issue. Print the SHAP dependence plot for the top disagreeing feature to understand the relationship before accepting it.

---

## 7.2 Directional impact

Generate the beeswarm (violin/swarm) plot. This shows, for every feature, whether high values push toward fraud or away from it — and critically, whether the relationship is monotonic or non-linear. The beeswarm will visually confirm (or contradict) the non-linear patterns you found in Phase 5.

---

## 7.3 Individual transaction explanations

Generate force plots for individual high-risk transactions. These show exactly why a specific transaction was scored high: "velocity was extreme (+0.32 to fraud score), amount was 4x average (+0.18), partially offset by signature present (-0.08) and normal business hours (-0.05)."

This is what investigators use. Not a risk score — a reason. Rename all features to human-readable labels before computing SHAP values. No investigator interprets `txn_cnt_1h`. They interpret "Transactions in Last Hour."

---

## 7.4 Narrative integration

The SHAP analysis feeds directly into the narrative. The global importance ranking tells the data scientist which signals matter most. The directional plots tell them how those signals work. The individual explanations give them concrete examples to show the business. Write this section of the narrative as if you're explaining it to someone who understands fraud but doesn't know what SHAP is.

---

**Exit criteria:** Global importance computed on 2K sample, disagreement check executed, beeswarm + force plots generated, features renamed to human-readable labels. Proceed to `phase_08_dashboard.md`.
