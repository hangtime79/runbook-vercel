# Data Quality Assessment — Phase 2

---

## 1. Null Audit

### Overall Null Rates

| Table | Rows | Null Rate | Status |
|---|---|---|---|
| transactions.csv | 327,005 | 2.47% | CLEAN |
| cardholder_info.csv | 44,335 | 0.00% | CLEAN |
| merchant_info.csv | 70,086 | 0.00% | CLEAN |
| **All tables** | — | **0.82%** | ✓ **ACCEPTABLE** |

### Column-Level Null Rates (transactions.csv)

| Column | Null Count | Null Rate | Notes |
|---|---|---|---|
| `transaction_id` | 0 | 0.0% | Primary key; complete |
| `authorized_flag` | 72,781 | 22.3% | LABEL; nulls are pending/disputed (expected) |
| `purchase_date` | 0 | 0.0% | Complete |
| `card_id` | 0 | 0.0% | Foreign key; complete |
| `merchant_id` | 0 | 0.0% | Foreign key; complete |
| `merchant_category_id` | 0 | 0.0% | Complete |
| `item_category` | 0 | 0.0% | Complete |
| `purchase_amount` | 0 | 0.0% | Complete |
| `signature_provided` | 0 | 0.0% | Complete |

**cardholder_info.csv:** 0 nulls across all 7 columns (card_id, first_active_month, reward_program, latitude, longitude, fico_score, age).

**merchant_info.csv:** 0 nulls across all 5 columns (merchant_id, merchant_category_id, subsector_description, latitude, longitude).

---

## 2. Fraud-Conditional Null Rates (Leakage Sentinel)

### Hypothesis
If any column shows dramatically different null rates for fraud=1 vs fraud=0, it signals potential **post-determination leakage** (e.g., a field populated only after fraud is determined).

### Analysis on Labeled Subset (254,224 rows)
- Fraud (authorized_flag=0): 24,080 rows
- Legit (authorized_flag=1): 230,144 rows

### Result
**✓ NO FRAUD-CONDITIONAL NULL ASYMMETRIES DETECTED.**

All non-label columns have null rates that are evenly distributed across fraud and legitimate subsets. No column exhibits differential missingness by label. This indicates:
1. The labeled data has not been post-enriched conditioned on fraud outcome.
2. The dataset does not show signs of leakage via selective nullification.

---

## 3. Coordinate Plausibility

### Cardholder Billing Coordinates
- **Latitude valid [-90, 90]:** 44,335 / 44,335 rows ✓
- **Longitude valid [-180, 180]:** 44,335 / 44,335 rows ✓
- **Implausible rows:** 0

### Merchant Location Coordinates
- **Latitude valid [-90, 90]:** 70,086 / 70,086 rows ✓
- **Longitude valid [-180, 180]:** 70,086 / 70,086 rows ✓
- **Implausible rows:** 0

**Verdict:** All geographic coordinates are within valid Earth bounds. Distance-based features (e.g., distance between cardholder and merchant) are safe to compute downstream.

---

## 4. Categorical Cardinality

| Column | Distinct Values | Total Rows | Cardinality Class | Encoding Strategy |
|---|---|---|---|---|
| `card_id` | 44,335 | 327,005 | **High (KEY)** | Join key; entity embedding if needed |
| `merchant_id` | 70,086 | 327,005 | **High (KEY)** | Join key; entity embedding if needed |
| `merchant_category_id` | 269 | 327,005 | **Medium** | One-hot encode or frequency encode |
| `subsector_description` | 38 | 70,086 | **Medium** | One-hot encode |
| `item_category` | 4 | 327,005 | **Low** | One-hot encode (binary expansion) |
| `reward_program` | 3 | 44,335 | **Low** | One-hot encode |
| `signature_provided` | 2 | 327,005 | **Binary** | Already binary; keep as-is |

**Notes:**
- High-cardinality keys (card_id, merchant_id) will be handled as aggregation keys in feature engineering; not encoded directly into the feature matrix.
- 269 merchant categories and 38 subsectors are moderate-cardinality and encodable via one-hot.
- 4 item categories and 3 reward tiers are low-cardinality; safe for direct encoding.

---

## 5. Date Range Validation

| Metric | Value |
|---|---|
| **Earliest transaction** | 2017-01-01 00:00:59 |
| **Latest transaction** | 2018-04-30 23:33:44 |
| **Span** | 16.1 months |
| **Distinct dates** | 315,863 |
| **Plausibility** | ✓ Valid range (no pre-1970 or post-2099 errors) |

All timestamps are formatted consistently as ISO 8601 (`YYYY-MM-DD HH:MM:SS`). No parse failures detected.

---

## 6. Negative Purchase Amounts

### Refunds and Reversals Audit

| Metric | Value |
|---|---|
| **Negative amount rows** | 355 (0.11% of 327,005 transactions) |
| **Amount range** | -$641.29 to -$0.01 |
| **Mean refund amount** | -$55.74 |

### Fraud Rate on Negative Amounts

| Label | Count | Rate |
|---|---|---|
| Fraud (authorized_flag=0) | 29 | 10.94% |
| Legitimate (authorized_flag=1) | 236 | — |
| Pending/disputed (NULL) | 90 | — |
| **Total labeled** | **265** | **10.94%** |

**Comparison:** Baseline fraud rate (labeled subset) is 9.47%. Negative amounts have a fraud rate of 10.94%, a +1.47 percentage point elevation—**not anomalous**. This is consistent with CLAUDE.md guidance: refunds/reversals run at or near baseline and can remain in the dataset.

**Action:** Keep all 355 negative amount rows. Do not filter.

---

## 7. Duplicate Transaction IDs

| Metric | Value |
|---|---|
| **Total transaction rows** | 327,005 |
| **Distinct transaction IDs** | 327,005 |
| **Duplicate rows** | 0 |

**Verdict:** ✓ **GRAIN IS CLEAN.** No duplicate transactions detected. One row = one card authorization event.

---

## 8. Join Key Coverage

### transactions → cardholder_info (card_id)
- Distinct card_id in transactions: 44,335
- Distinct card_id in cardholder_info: 44,335
- **Orphans (transaction card_id not in cardholder_info):** 0
- **Status:** ✓ Perfect coverage; LEFT JOIN is safe.

### transactions → merchant_info (merchant_id)
- Distinct merchant_id in transactions: 70,086
- Distinct merchant_id in merchant_info: 70,086
- **Orphans (transaction merchant_id not in merchant_info):** 0
- **Status:** ✓ Perfect coverage; LEFT JOIN is safe.

---

## 9. Quality Verdict

| Dimension | Status | Notes |
|---|---|---|
| **Null rates** | ✓ CLEAN | 0.82% overall; authorized_flag nulls are expected pending/disputed label. |
| **Fraud-conditional nulls** | ✓ NO LEAKAGE DETECTED | All columns have symmetric null distribution across fraud/legit subsets. |
| **Coordinates** | ✓ PLAUSIBLE | 100% of lat/lon values fall within valid Earth bounds (-90 to 90, -180 to 180). |
| **Cardinality** | ✓ ENCODABLE | All categorical columns are either low-cardinality (1-10 values), medium (20-300), or join keys. |
| **Date range** | ✓ VALID | Consistent ISO 8601 format, plausible span (2017-01-01 to 2018-04-30). |
| **Negative amounts** | ✓ ACCEPTABLE | 355 refunds/reversals at baseline fraud rate; retain without filtering. |
| **Grain** | ✓ CLEAN | No duplicate transaction IDs; one row per authorization event. |
| **Join coverage** | ✓ COMPLETE | Zero orphans on card_id and merchant_id; LEFT JOIN is safe. |

---

## 10. Final Verdict

### Status: **PASS**

**The dataset is clean and ready for Phase 3 (golden record).**

**Key findings:**
1. Null rates are minimal (0.82% overall), and the authorized_flag nulls (22.3%) are expected pending/disputed transactions that will be filtered downstream.
2. No fraud-conditional null asymmetries detected—no leakage signals via selective missingness.
3. All coordinates are plausible; distance-based features can be computed safely.
4. Join keys have perfect coverage (zero orphans) and are suitable for enrichment.
5. Negative amounts (refunds/reversals) are present at baseline fraud rate and can remain.
6. Temporal grain is clean: no duplicates, consistent date format, valid timestamp range.

**Assumptions:**
- The dataset represents a specific card transaction population (possibly pre-filtered for suspicious activity) with an elevated fraud rate (9.47%) relative to typical card portfolios. Stratified train/test splitting will be mandatory.
- All timestamps are in a single timezone (assumed UTC or card-issuer local time); no timezone conversions needed.
- Negative amounts are legitimate refunds/reversals, not data quality errors.

**No blocking issues. Proceed to Phase 3.**

---

*Phase 2 complete. Quality verdict: PASS. Next phase: Phase 3 (Golden Record).*
