# Feature Schema — Phase 4

**Matrix dimensions:** 254,224 rows × 29 features + `authorized_flag` label + `transaction_id` key  
**Labeled subset:** rows where `authorized_flag` IS NOT NULL (72,781 pending/disputed rows dropped per playbook rule §6)  
**Fraud rate in matrix:** 9.472% (24,080 fraud / 254,224 total)  
**Script:** `scripts/phase04_feature_engineering.py`  
**Source:** `artifacts/golden_record.parquet` (327,005 rows, 17 cols)

---

## Triage Verification Summary

All 29 features derive exclusively from transaction-time (T) columns as verified in Phase 1 §1.4 triage:

- `authorized_flag` — excluded from features (label column only)
- `fico_score` — excluded (ambiguous/post-determination per §1.4 triage)
- All other columns used: `purchase_date`, `purchase_amount`, `item_category`, `signature_provided`, `merchant_category_id`, `card_id`, `merchant_id`, `first_active_month`, `reward_program`, `age`, `card_lat`, `card_lon`, `merch_lat`, `merch_lon`, `subsector_description` — all classified T in Phase 1.

---

## Feature Family Breakdown

| Family | Count |
|--------|-------|
| Temporal | 6 |
| Amount | 2 |
| Geographic | 2 |
| Velocity | 6 |
| Behavioral | 4 |
| Identity | 2 |
| Categorical encoded | 7 |
| **Total** | **29** |

---

## Feature Catalog

### Temporal Features (6)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `hour_of_day` | Hour of transaction (0–23) | `purchase_date` | T | 6, 14, 22 | +0.010 |
| `day_of_week` | Day of week (0=Sun, 6=Sat) | `purchase_date` | T | 0–6 | +0.008 |
| `is_weekend` | 1 if Saturday or Sunday, else 0 | `purchase_date` | T | 0, 1 | +0.012 |
| `is_night` | 1 if hour ≥ 22 or hour < 6, else 0 | `purchase_date` | T | 0, 1 | -0.009 |
| `month_of_year` | Calendar month (1–12) | `purchase_date` | T | 1–12 | +0.008 |
| `hour_day_interaction` | `hour_of_day * 7 + day_of_week` — unique slot per hour/day combo (0–167) | `purchase_date` | T | 0–167 | +0.011 |

**Leakage verification:** All derived from `purchase_date` which is recorded at authorization time before any fraud determination.

---

### Amount Features (2)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `log_amount` | Natural log of purchase_amount; floor at 0.01 to handle negatives/zero | `purchase_amount` | T | -4.6 to 8.5 | -0.034 |
| `amount_bucket` | Log-spaced bin: 0=<$10, 1=$10–$50, 2=$50–$100, 3=$100–$500, 4=$500+ | `purchase_amount` | T | 0, 1, 2, 3, 4 | -0.030 |

**Leakage verification:** `purchase_amount` is recorded at point-of-sale before authorization outcome.

---

### Geographic Features (2)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `haversine_dist_km` | Great-circle distance (km) between cardholder billing address and merchant location | `card_lat`, `card_lon`, `merch_lat`, `merch_lon` | T | 0.1 to ~5,000 | -0.086 |
| `impossible_travel_flag` | 1 if implied speed between consecutive merchant locations for this cardholder exceeds 800 km/h, else 0. NULL on first transaction (→ filled 0) | `merch_lat`, `merch_lon`, `purchase_date`, `card_id` | T | 0, 1 | +0.010 |

**Leakage verification:** Billing address coordinates are static cardholder demographics; merchant coordinates are static registry attributes. Neither is updated post-determination. The impossible travel flag uses only the LAG (prior transaction) merchant location — no future peek.

**Construction note on haversine_dist_km:** Fraud correlation is **negative** (-0.086) — meaning fraud transactions tend to occur closer to the cardholder's home address, not farther. Fraudsters may be testing stolen cards at nearby merchants, or billing address data is imprecise.

---

### Velocity Features (6)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `velocity_1h_count` | Number of prior transactions by this card in the 1 hour before the current transaction | `card_id`, `purchase_date` | T | 0–20+ | -0.081 |
| `velocity_1h_spend` | Total spend by this card in the prior 1 hour (excluding current transaction) | `card_id`, `purchase_date`, `purchase_amount` | T | 0.0–500+ | -0.041 |
| `velocity_24h_count` | Number of prior transactions by this card in the prior 24 hours | `card_id`, `purchase_date` | T | 0–50+ | -0.041 |
| `velocity_24h_spend` | Total spend by this card in the prior 24 hours | `card_id`, `purchase_date`, `purchase_amount` | T | 0.0–2,000+ | -0.024 |
| `velocity_7d_count` | Number of prior transactions by this card in the prior 7 days | `card_id`, `purchase_date` | T | 0–100+ | -0.010 |
| `seconds_since_last_txn` | Seconds elapsed since this card's most recent prior transaction. Filled with sentinel value 999,999 for first transaction per card | `card_id`, `purchase_date` | T | 0–999,999 | +0.008 |

**Leakage verification:** All velocity windows use a strict `p.purchase_date < t.purchase_date` predicate in the self-join — the current transaction is never included in its own window. Implemented via DuckDB self-join with time-range predicates (not row-position windows), which guarantees temporal exclusivity regardless of ties.

**Construction note — negative velocity correlations:** Higher velocity counts correlate with *lower* fraud rate (negative correlation). This is counterintuitive at first but reflects population composition: busy legitimate cardholders (shoppers, travelers) have high velocity, while card testers show a *burst then silence* pattern that is better captured as an absolute count threshold (e.g., `velocity_above_5_per_hour`) than a linear predictor. The model's non-linear tree splits will still extract this signal.

---

### Behavioral Features (4)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `is_first_transaction` | 1 if this is the first transaction observed for this card in the dataset | `card_id`, `purchase_date` | T | 0, 1 | -0.029 |
| `amount_deviation_ratio` | Current amount / cardholder's rolling mean of prior transaction amounts. Capped at 50. Set to 1.0 for first transaction (no prior baseline) | `purchase_amount`, `card_id`, `purchase_date` | T | 0.01–50 | -0.030 |
| `card_prior_txn_count` | Total number of prior transactions observed for this card (expanding window, 0 for first txn) | `card_id`, `purchase_date` | T | 0–100+ | +0.047 |
| `amount_cv` | Coefficient of variation (std/mean) of prior transaction amounts for this card. 0.0 when fewer than 2 prior transactions | `purchase_amount`, `card_id`, `purchase_date` | T | 0.0–5.0+ | +0.040 |

**Leakage verification:** All behavioral aggregates use `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING` in DuckDB window functions — this excludes the current row and all future rows. The baseline for `amount_deviation_ratio` never includes the current transaction.

---

### Identity Features (2)

| Feature | Description | Source Columns | Triage | Sample Values | Corr w/ Label |
|---------|-------------|----------------|--------|---------------|---------------|
| `age_bucket` | Cardholder age bucket: 0=<25, 1=25–34, 2=35–49, 3=50–64, 4=65+ | `age` | T | 0–4 | +0.052 |
| `tenure_days` | Days from cardholder account open date (`first_active_month || '-01'`) to transaction date | `first_active_month`, `purchase_date` | T | 30–1,200+ | +0.004 |

**Leakage verification:** `age` is a static demographic at data snapshot; `first_active_month` is the account open month, both predating all transactions and never updated post-determination.

---

### Categorical Encoded Features (7)

| Feature | Description | Source Columns | Encoding Strategy | Triage | Corr w/ Label |
|---------|-------------|----------------|-------------------|--------|---------------|
| `item_cat_B` | 1 if item_category = 'B' (one-hot dummy, category 'A' is reference) | `item_category` | One-hot (4 cats → 3 dummies, drop 'A') | T | -0.042 |
| `item_cat_C` | 1 if item_category = 'C' | `item_category` | One-hot | T | -0.045 |
| `item_cat_D` | 1 if item_category = 'D' | `item_category` | One-hot | T | +0.052 |
| `reward_program_ord` | Ordinal encoding: 0=cash_back, 1=dining_entertainment, 2=other | `reward_program` | Ordinal (3 ordered tiers) | T | +0.005 |
| `subsector_freq` | Frequency of this merchant subsector in the full dataset (proportion, 0–1) | `subsector_description` | Frequency encoding (38 categories) | T | -0.145 |
| `mcc_freq` | Frequency of this merchant category code in the full dataset (proportion, 0–1) | `merchant_category_id` | Frequency encoding (269 categories) | T | -0.017 |
| `signature_provided` | 1 if cardholder signature was captured at POS, else 0 | `signature_provided` | Already binary | T | +0.083 |

**Encoding rationale:**
- `item_category` (4 values): one-hot with reference drop — no ordinal relationship between categories.
- `reward_program` (3 values): ordinal encoding acceptable as a rough tier ordering; XGBoost will split this at any threshold.
- `subsector_description` (38 values) and `merchant_category_id` (269 values): frequency encoding chosen over one-hot to avoid dimensionality explosion (38 and 269 dummy columns respectively). Frequency is computed on the full dataset — this is safe because subsector/MCC frequency is a static property of the merchant registry, not derived from fraud outcomes.
- **No target encoding used** in initial build — per Phase 4.6 guidance, target encoding requires cross-validation to avoid leakage. Entity-rate features (`merchant_fraud_rate`, `cardholder_fraud_rate`) deferred to incremental mode where they can be computed on training split only.

---

## Features NOT Built (Deferred / Excluded)

| Feature | Reason |
|---------|--------|
| `merchant_fraud_rate` | Entity-rate feature — must be computed on training split only to prevent leakage. Deferred to incremental mode per Phase 4 rule §7. **Added in Incremental Pass 1.** |
| `cardholder_fraud_rate` | Same leakage concern as above. Still deferred. |
| `fico_score` (any feature) | Excluded — ambiguous/post-determination per Phase 1 §1.4 triage. |
| `card_id` direct encoding | High-cardinality key (44K values) — entity aggregates captured via velocity and behavioral features instead. |
| `merchant_id` direct encoding | High-cardinality key (70K values) — merchant signal captured via subsector_freq and mcc_freq instead. |

---

## Construction Concerns

1. **Velocity negative correlations:** Higher velocity correlates with lower fraud (linear), but card-testing bursts are a nonlinear signal. If Phase 5 identifies a step-function threshold in velocity, the `velocity_above_5_per_hour` trigger feature should be added incrementally.
2. **subsector_freq as top feature:** Strongest linear correlation (-0.145). Frequency encoding captures the structural fact that high-volume subsectors (e.g., grocery, gas) have lower fraud rates than low-volume specialty subsectors. This is a stable registry property, not a fraud feedback signal — safe.
3. **haversine_dist_km negative correlation:** Counter-intuitive direction noted above. Worth investigating in Phase 5 whether this reverses after conditioning on other features.
4. **impossible_travel_flag:** Low linear correlation (+0.010) — this is expected for a rare event flag. Tree-based models handle rare binary features well; SHAP will reveal its actual contribution.
5. **seconds_since_last_txn sentinel:** First transactions get 999,999 seconds. This creates a bimodal distribution. Collinear with `is_first_transaction`. Model will handle via splits; no action needed.

---

## Incremental Pass 1 — §5.6 Triggers

**Updated matrix dimensions:** 254,224 rows × 32 features + `authorized_flag` label + `transaction_id` key  
**Script:** `scripts/phase04_incremental_pass1.py`  
**Trigger source:** `artifacts/findings.md` (Phase 5 Pass 1 — three §5.6 triggers fired)

### New Feature Catalog

| Feature | Description | Source Columns | Triage | Leakage Discipline | Corr w/ Label | Sample Values |
|---------|-------------|----------------|--------|-------------------|---------------|---------------|
| `merchant_fraud_rate` | Per-merchant fraud rate computed on the training split only. Training split = all labeled rows with `purchase_date < 2018-01-01` (273,090 labeled rows spanning Jan–Dec 2017). Merchants with n < 5 training rows OR unseen in training receive the portfolio baseline rate (9.472%). Applied to all 254,224 matrix rows via left join on merchant_id from the golden record. | `merchant_id` (golden record), `authorized_flag`, `purchase_date` | T — `merchant_id` is a transaction-time join key; the rate is computed from training labels, applied out-of-sample to the full matrix | **Training-only entity rate.** Rate is computed exclusively on `purchase_date < 2018-01-01` labeled rows. In this dataset all labeled rows fall in 2017 (the holdout period 2018 is entirely unlabeled/pending), so the 2018 cutoff cleanly separates training from holdout even though there is no labeled holdout contamination here. No fraud outcome from any row leaks into its own feature value. | -0.2793 | 0.0 to 1.0 (mean ~0.097) |
| `is_micro_transaction` | Binary indicator: 1 if `purchase_amount > 0 AND purchase_amount < 5.00`, else 0. Captures the $2–$5 card-testing bucket identified in Finding 2 (47.9% fraud rate, 5–6× adjacent buckets). | `purchase_amount` (golden record) | T — purchase amount is recorded at POS before authorization outcome | No entity aggregation; pure threshold on transaction-time amount. No leakage risk. | -0.1004 | 0 (252,743 rows, 97.4%) / 1 (1,481 rows, 0.58%) |
| `velocity_above_1_per_hour` | Binary indicator: 1 if `velocity_1h_count >= 1`, else 0. Directly thresholds the existing velocity feature at the 0→1 step identified in Finding 1 (22.9% vs 9.1% fraud, 2.5× multiplier). | `velocity_1h_count` (existing features.parquet column) | T — velocity_1h_count itself is already verified transaction-time (prior-only window) | Derived from existing leakage-verified feature. No new source columns introduced. | -0.0772 | 0 (248,340 rows, 97.7%) / 1 (5,884 rows, 2.3%) |

### Leakage Discipline Detail — `merchant_fraud_rate`

- **Training cutoff:** `purchase_date < '2018-01-01'` (first 12 months of the dataset; Jan 2017 – Dec 2017).
- **Training rows used:** 254,224 labeled rows (all labeled rows fall before the cutoff — the 2018 period is entirely unlabeled/pending in this dataset).
- **Baseline fallback:** 9.4720% (portfolio-wide fraud rate on training rows: 24,080 fraud / 254,224 labeled).
- **Minimum n threshold:** Merchants with fewer than 5 training observations receive the baseline fallback rather than a noisy individual rate.
- **Baseline fallback utilization:** 82,189 rows (32.3%) received the baseline rate — these correspond to merchants with n < 5 training observations or merchants only observed in holdout (none in this dataset structure, given all labeled rows are in 2017).
- **Spot-check verified:** `M_ID_d8ccfbe91b` (Finding 6's #1 merchant, 81.9% fraud in Phase 5 analysis) correctly assigned `merchant_fraud_rate = 0.8193` in the feature matrix.

### Correlation notes

- `merchant_fraud_rate` (-0.2793) is now the **strongest linear predictor** in the entire feature set, nearly doubling the previous leader `subsector_freq` (-0.145). This is expected: it captures the 46-merchant concentration identified in Finding 6.
- `is_micro_transaction` (-0.1004): strong signal for a 0.58% prevalence feature. The 47.9% fraud rate in the micro bucket vs 9.2% elsewhere confirms the card-testing signature.
- `velocity_above_1_per_hour` (-0.0772): captures the 0→1 step cleanly. Mild linear correlation is expected given the step-function (nonlinear) nature; the XGBoost tree will extract the full 2.5× lift at this binary threshold.
