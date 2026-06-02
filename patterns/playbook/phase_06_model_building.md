# Phase 6: Model Building

**Load this file when:** Phase 5 pattern discovery is complete (including §5.6 iteration triggers).
**Prerequisites:** `phase_05_pattern_discovery.md`.
**Next:** `phase_07_interpretability.md`. Or loop: Check 1 → re-read `phase_01_orientation.md` §1.4; Check 2 sub-check 5 → re-read `phase_05_pattern_discovery.md` §5.6.

Use XGBoost. It handles missing values natively, works with mixed feature types, captures the non-linear patterns that define fraud data, and is well-supported by SHAP.

---

## 6.1 What this model is and isn't

**Be honest with yourself:** You are building a directional model that identifies which features and patterns carry the most fraud signal in this dataset. You are not building a production fraud detection system. The model's primary value is that it validates (or contradicts) your Phase 5 findings through SHAP, and it gives investigators a risk-scoring lens to prioritize their queue.

A good model with clear interpretability is the goal. A perfect model is not the goal and is not achievable with transaction-level features alone. Don't spend excessive effort tuning — spend it on findings and narrative.

---

## 6.2 Training discipline

- **Stratified K-Fold cross-validation.** Use 5 folds. This gives you a mean AUC and standard deviation across folds, not a single number from one lucky or unlucky split. Report both: "AUC: 0.68 ± 0.02 across 5 folds" is a trustworthy result. "AUC: 0.68" from a single split is a guess.
- **Hold out a final test set before K-Fold.** Stratified 80/20 split first with `random_state=42` for reproducibility. The 80% gets K-Folded for training and validation. The 20% holdout is touched once for final metrics. This prevents any information from the test set leaking through fold selection.
- **Use all engineered features.** Don't pre-filter based on your intuition — let the model and SHAP determine what matters. Your intuition is tested in Phase 5; the model gets to have its own opinion.
- **Set `scale_pos_weight`** to the ratio of legitimate to fraud transactions. This handles class imbalance without synthetic oversampling, which introduces artifacts.

---

## 6.3 Hyperparameters — start here, then diagnose

Start with these defaults. They are deliberately moderate:

```
max_depth: 4
learning_rate: 0.1
n_estimators: 300
min_child_weight: 5
subsample: 0.8
colsample_bytree: 0.8
scale_pos_weight: (negative class count / positive class count)
eval_metric: 'auc'
early_stopping_rounds: 30
```

Train the model. Record the AUC. Then run the diagnostic in §6.5 before deciding whether to adjust.

---

## 6.4 Evaluation metrics

- **AUC-ROC** is the primary discrimination metric. Report the mean and standard deviation across K-Fold, plus the holdout test set value.
- **Precision-Recall AUC** is the primary operational metric. In imbalanced data, a model can achieve 95%+ accuracy by never flagging fraud. The PR curve exposes this failure mode.
- **Confusion matrix** at a chosen threshold. Pick a threshold that reflects operational reality — typically optimizing for a target precision (e.g., "we want at least 50% of flagged transactions to be actual fraud") rather than a statistical criterion.
- **Risk score distributions** for fraud vs. legitimate. Plot them overlaid. The visual separation between the two distributions is more informative than any single metric.

---

## 6.5 Model diagnostic — run this before accepting the result

After training, answer these questions in order. Each one has a specific action if the answer is concerning.

**Check 1: Is AUC suspiciously high (> 0.85 with transaction-only features)?**
→ Almost certainly label leakage. Re-load `phase_01_orientation.md` and return to §1.4. Print the top 5 features by SHAP importance. For each one, verify it's transaction-time data. Check for columns with null patterns that correlate perfectly with the label. Fix the leak. Retrain.

**Check 2: Is AUC low (< 0.62)?**
→ Run these sub-checks in order:
  1. **Feature construction bugs.** Print 10 sample rows of your engineered features. Do the values make sense? Are rolling windows computing correctly? Is haversine producing reasonable distances (not zeros, not NaN)? A single broken feature can drag the whole model down.
  2. **Class weight.** Is `scale_pos_weight` set? An unweighted model on severely imbalanced data will learn to predict "not fraud" for everything.
  3. **Feature signal.** Print the correlation between each feature and the label. If no feature has correlation above 0.05, the feature set may genuinely lack signal — but check construction first.
  4. **Underfitting.** Try relaxing: increase `max_depth` to 6, increase `n_estimators` to 500, decrease `learning_rate` to 0.05. If AUC jumps by more than 0.03, the original model was underfit. Use the relaxed parameters.
  5. **Missing iteration.** Did you execute the Phase 5.6 triggers? If not, re-load `phase_05_pattern_discovery.md` and go back. The features built from data-driven triggers are often the ones that close the gap.

If AUC is still below 0.62 after all sub-checks, the dataset may genuinely lack the signals needed for strong transaction-level detection. Document this honestly in the narrative. This is a finding, not a failure.

**Check 3: Is the standard deviation across folds large (> 0.05)?**
→ The model is unstable. Likely cause: small dataset or a few high-influence observations. Note this in the narrative. Consider whether the findings from Phase 5 are more trustworthy than the model for this dataset.

**Check 4: Are the learning curves converging?**
→ Plot training AUC vs. validation AUC across estimators. If training AUC is much higher than validation AUC and the gap isn't closing, the model is overfitting. Reduce `max_depth` to 3, increase `min_child_weight` to 10. If both curves are still rising and haven't plateaued, increase `n_estimators`.

---

## 6.6 Calibrating expectations

Transaction-level features alone (no device fingerprinting, no IP data, no real-time network signals) typically produce AUC in the 0.62–0.78 range. This is genuine and expected.

**Always explain what additional data sources would improve the model.** This is not an excuse — it's operational guidance. The narrative should say what the model can do now and what it could do with additional signals. Common high-value additions: device fingerprinting, IP geolocation, 3DS authentication results, real-time network velocity from the card network, merchant risk databases.

---

**Exit criteria:** Model trained with stratified K-Fold, holdout metrics recorded, §6.5 diagnostic executed, any loops completed. Proceed to `phase_07_interpretability.md`.
