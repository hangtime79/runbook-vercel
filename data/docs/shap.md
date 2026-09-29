# Phase 7 — SHAP Interpretability

**Sample:** 2,000-row stratified holdout sample (fraud=189, legit=1811; fraud rate 9.45%).
**Method:** `shap.TreeExplainer` (exact, tree-based) on the final XGBoost model.
**Script:** `scripts/phase07_shap.py`

---

## Top-10 Global Importance (mean |SHAP|)

| Rank | Feature (Human-Readable) | Raw Name | Mean \|SHAP\| |
|---|---|---|---|
| 1 | Merchant Historical Fraud Rate | `merchant_fraud_rate` | 1.01248 |
| 2 | Merchant Subsector Fraud Frequency | `subsector_freq` | 0.59278 |
| 3 | Signature Provided | `signature_provided` | 0.25522 |
| 4 | Card-to-Merchant Distance (km) | `haversine_dist_km` | 0.18046 |
| 5 | Cardholder Age Bucket | `age_bucket` | 0.17453 |
| 6 | Card Prior Transaction Count | `card_prior_txn_count` | 0.15839 |
| 7 | MCC Fraud Frequency | `mcc_freq` | 0.15223 |
| 8 | Item Category B Flag | `item_cat_B` | 0.11834 |
| 9 | Item Category C Flag | `item_cat_C` | 0.11044 |
| 10 | Log Transaction Amount | `log_amount` | 0.10541 |

Notably absent from the top-10: `is_micro_transaction` (rank ~12) and `velocity_above_1_per_hour`
(rank ~13). These features are critical for card-testing *detection* (high positive predictive value
at threshold) but they fire on very few transactions — so their contribution to *mean* |SHAP|
across the full sample is diluted. The beeswarm long tails confirm they spike hard on the rare
rows where they activate.

---

## Directional Summary (from beeswarm + dependence plots)

| Feature | Direction | Mechanism |
|---|---|---|
| Merchant Historical Fraud Rate | High value → toward fraud | Logarithmic, not linear (see dep. plot 1) |
| Merchant Subsector Fraud Frequency | High value → toward fraud | Step-function at ~0.14 threshold (see dep. plot 2) |
| Signature Provided | 1 (signed) → toward legit | Clean binary: SHAP ~ +0.12 when no sig, ~ −0.65 when signed |
| Card-to-Merchant Distance (km) | High distance → toward legit (weak) | Slight negative SHAP for very large distances — surprising |
| Cardholder Age Bucket | Higher age → toward legit | Monotone decline; 65+ bucket significantly protective |
| Card Prior Transaction Count | Low count → toward fraud | New cards have sparse histories; more risk |
| MCC Fraud Frequency | High value → toward legit | Collinear with subsector_freq; captures same signal |
| Item Category B/C | Category B/C present → toward legit | Protective categories relative to baseline |
| Log Transaction Amount | Non-linear | Low amounts and very high amounts both push toward fraud |

**Note on sign convention:** The beeswarm x-axis is SHAP value (contribution to P(fraud)). Positive
SHAP = pushes toward higher fraud probability. Negative SHAP = pushes toward lower fraud probability.
The mean signed SHAP across all features is negative because ~90% of transactions are legitimate
and the model correctly pulls them toward the low-fraud baseline.

---

## Disagreement Check vs Phase 5 Variance Ranking

**Phase 5 top-3 variance dimensions:**
1. `velocity_1h_count` (90.9 pp range — step function)
2. `subsector_description` / `subsector_freq` (13.4 pp range)
3. `amount_bucket` (10.9 pp range — non-linear U)

**SHAP top-3 (mean |SHAP|):**
1. `merchant_fraud_rate` (mean |SHAP| 1.012 — dominant)
2. `subsector_freq` (mean |SHAP| 0.593)
3. `signature_provided` (mean |SHAP| 0.255)

**Verdict: MINOR DISAGREEMENT (1 of 3 direct overlap)**

`subsector_freq` is the only direct hit. `merchant_fraud_rate` and `signature_provided` dominate
SHAP but were not in Phase 5's top-3 variance ranking.

**Explanation — this is expected and coherent, not a red flag:**

- `merchant_fraud_rate` was added *after* Phase 5 Pass 1 (Loop 1 trigger: `merchant_concentration`).
  It wasn't ranked in the Phase 5 variance table because it didn't exist yet. Once added, Phase 5
  reported it as the strongest linear predictor (corr −0.279). SHAP's #1 ranking confirms the model
  exploits it heavily. No disagreement in substance; just a sequencing artifact.

- `velocity_1h_count` / `velocity_above_1_per_hour` rank outside top-10 in mean |SHAP| despite
  being Phase 5's loudest univariate signal (90.9 pp range). This is the genuine interaction finding:
  the velocity step-function fires on only ~2.3% of transactions (5,884 rows at v1h ≥ 1). The SHAP
  importance metric is mean over all rows — so a feature that fires hard on 2% of rows but is zero
  elsewhere ranks low globally even if it's operationally critical. The model is not "ignoring"
  velocity — it's that `merchant_fraud_rate` and `subsector_freq` carry continuous signal across
  *all* 100% of transactions, dominating the average.

- `signature_provided` ranks #3 in SHAP despite ranking #6 in Phase 5 variance (6.1 pp range).
  SHAP sees through the binary nature: the 2.3× protection factor is exploited by every tree split
  on this column, accumulating large average contribution even though the univariate pp range is
  modest. This is a genuine interaction insight: in combination with merchant context, the presence
  or absence of signature is the third most informative bit the model has.

**Dependence plot anomalies:**

- **Plot 1 (Merchant Historical Fraud Rate):** Logarithmic saturation. SHAP rises steeply from 0%
  to 20% merchant fraud rate, then flattens. The model doesn't differentiate much between a 50%
  and 80% fraud-rate merchant — both are already "very suspicious." The interaction color
  (subsector_freq) shows blue (low-subsector-freq) points sit *above* the main trend at low
  merchant rates — merchants in low-fraud subsectors get credit for that context. Non-monotonic
  in the 0–5% range (cold pile at merchant_fraud_rate ≈ 0 creates a discontinuity).

- **Plot 2 (Merchant Subsector Fraud Frequency):** Discrete step-function rather than continuous.
  The `subsector_freq` feature is a categorical frequency-encoded variable — there are only 38
  distinct subsectors, so the scatter falls on vertical stripes. The step occurs around 0.14
  (luxury goods / consumer electronics / internet tier) where SHAP jumps from −1.5 to +0.3.
  The interaction (colored by merchant_fraud_rate) shows that within each subsector cluster,
  high merchant-fraud-rate (pink/red) points do not get much additional lift — subsector context
  is partially absorbed into merchant_fraud_rate and vice versa.

- **Plot 3 (Signature Provided):** Clean binary. No interaction visible with distance (the SHAP
  auto-selected interaction color); the spread within each binary value is essentially pure noise.

---

## Force Plot Pre-Selected Candidates

### Candidate 1 — High-Risk True Positive (correctly flagged fraud)
- **Sample index (local):** 563
- **Original row index (features.parquet):** 95515
- **Predicted fraud probability:** 0.9697 (well above threshold 0.8588)
- **Actual label:** fraud (y=1)
- **Top-3 SHAP drivers:**
  - Merchant Historical Fraud Rate: +1.279 (merchant is flagged at high historical rate)
  - Log Transaction Amount: +0.891 (large transaction amplifies risk)
  - Transaction Under $5: +0.766 (micro-transaction card-testing signal active)
- **Narrative:** Classic card-testing transaction — a micro-amount purchase at a merchant already
  known to be high-fraud, with no signature. All three fraud typology signals stack.

### Candidate 2 — High-Risk False Positive (flagged but actually legitimate)
- **Sample index (local):** 354
- **Original row index (features.parquet):** 33144
- **Predicted fraud probability:** 0.9749 (highest false positive in sample)
- **Actual label:** legitimate (y=0)
- **Top-3 SHAP drivers:**
  - Merchant Historical Fraud Rate: +1.004 (merchant has elevated fraud history)
  - Card-to-Merchant Distance: +0.815 (long-distance transaction)
  - Transaction Under $5: +0.651 (micro-amount flag active)
- **Narrative:** A legitimate micro-transaction at a geographically distant, historically risky
  merchant. The model has no way to distinguish this from card testing — all risk signals fire.
  Illustrates the precision ceiling: at 50% precision threshold, half of flagged cases look exactly
  like this. Investigators should check cardholder travel history and prior usage at this merchant.

### Candidate 3 — Low-Risk True Negative (correctly cleared as legit)
- **Sample index (local):** 1988
- **Original row index (features.parquet):** 207232
- **Predicted fraud probability:** 0.0004 (near-zero)
- **Actual label:** legitimate (y=0)
- **Top-3 SHAP drivers:**
  - Merchant Historical Fraud Rate: −5.401 (merchant has near-zero historical fraud — very strong negative)
  - MCC Fraud Frequency: −1.177 (low-risk MCC category)
  - Merchant Subsector Fraud Frequency: −0.723 (low-risk subsector)
- **Narrative:** A transaction at a well-established, low-fraud merchant in a low-risk category.
  The model is extremely confident. The expected-value baseline (~1.4% prior) is then pushed down
  by all three merchant context signals simultaneously.

---

## Artifact Paths

| Artifact | Path |
|---|---|
| SHAP values + metadata | `artifacts/shap_values.npz` |
| Beeswarm (top 15) | `artifacts/shap_beeswarm.png` |
| Dependence plot #1 | `artifacts/shap_dependence_top1.png` |
| Dependence plot #2 | `artifacts/shap_dependence_top2.png` |
| Dependence plot #3 | `artifacts/shap_dependence_top3.png` |
| Global importance bar chart | `artifacts/shap_importance.png` |
| Holdout indices | `artifacts/holdout_indices.npy` |
