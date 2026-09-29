# Orientation Report — Phase 1

---

## 1. Grain Confirmation

| Attribute | Value |
|---|---|
| Source file | transactions.csv |
| Total rows | 327,005 |
| Distinct `transaction_id` | 327,005 |
| Grain confirmed: one row per transaction | YES |

**Grain:** One row = one card transaction authorization attempt. The transaction_id is a unique surrogate key — no duplicate events detected.

## 2. Label Column — `authorized_flag`

| Label State | Count | Share of total |
|---|---|---|
| 1 (authorized / legitimate) | 230,144 | 70.4% |
| 0 (unauthorized / fraud) | 24,080 | 7.4% |
| NULL (pending/disputed) | 72,781 | 22.3% |

- **Labeled subset** (`authorized_flag` IS NOT NULL): 254,224 rows
- **NULL / pending-disputed**: 72,781 rows (22.3%) — excluded from all fraud-rate calculations and model training.
- The NULL block is stored as empty string in the raw CSV (not literal 'NULL'); the load pipeline casts empty → SQL NULL.

## 3. Join Keys and Cardinality

### 3.1 transactions ↔ cardholder_info  (`card_id`)

| Attribute | Count |
|---|---|
| Distinct `card_id` in transactions | 44,335 |
| Distinct `card_id` in cardholder_info | 44,335 |
| Avg transactions per cardholder | 7.4 |
| Transaction `card_id` not in cardholder_info (orphans) | 0 |

### 3.2 transactions ↔ merchant_info  (`merchant_id`)

| Attribute | Count |
|---|---|
| Distinct `merchant_id` in transactions | 70,086 |
| Distinct `merchant_id` in merchant_info | 70,086 |
| Avg transactions per merchant | 4.7 |
| Transaction `merchant_id` not in merchant_info (orphans) | 0 |

> **Join type for downstream phases:** LEFT JOIN on both keys to preserve all transaction rows. Orphaned keys produce NULL-filled enrichment columns — Phase 2 data quality will quantify and flag these.

## 4. Time Range

| Attribute | Value |
|---|---|
| Earliest transaction | 2017-01-01 00:00:59 |
| Latest transaction | 2018-04-30 23:33:44 |
| Span | 484 days (~16.1 months) |

## 5. Class Balance (Labeled Subset Only)

| Class | Count | Rate |
|---|---|---|
| Authorized — legitimate (flag=1) | 230,144 | 90.5% |
| Unauthorized — fraud (flag=0) | 24,080 | 9.5% |
| **Total labeled** | **254,224** | 100.0% |

**Overall fraud rate on labeled subset: 9.47%**

Per playbook §1.2: 5–15% range → enriched sample or troubled subsegment. Verify whether this dataset was pre-filtered to suspicious transactions; base-rate findings should be treated as specific to this population. Stratified train/test splitting is mandatory. Consider `scale_pos_weight` in XGBoost (~9.6x ratio).

## 6. Schema Inventory

### transactions.csv  (327,005 rows)

| Column | Type | Cardinality | Null Rate | Interpretation |
|---|---|---|---|---|
| `transaction_id` | VARCHAR | 327,005 | 0.0% | Synthetic primary key; unique per row. |
| `authorized_flag` | INTEGER | 2 | 22.3% | LABEL: 0=fraud, 1=legit, NULL=pending/disputed (~22% of rows). |
| `purchase_date` | VARCHAR | 315,863 | 0.0% | Timestamp of authorization attempt. |
| `card_id` | VARCHAR | 44,335 | 0.0% | FK → cardholder_info; many transactions per cardholder. |
| `merchant_id` | VARCHAR | 70,086 | 0.0% | FK → merchant_info; many transactions per merchant. |
| `merchant_category_id` | VARCHAR | 269 | 0.0% | MCC numeric code; matches merchant_info.merchant_category_id. |
| `item_category` | VARCHAR | 4 | 0.0% | Single-letter product category code at point of sale. |
| `purchase_amount` | VARCHAR | 68,087 | 0.0% | Transaction amount USD; negative values are refunds/reversals (~265 rows). |
| `signature_provided` | VARCHAR | 2 | 0.0% | Binary (0/1): was a cardholder signature captured at POS? |

### cardholder_info.csv  (44,335 rows)

| Column | Type | Cardinality | Null Rate | Interpretation |
|---|---|---|---|---|
| `card_id` | VARCHAR | 44,335 | 0.0% | FK → cardholder_info; many transactions per cardholder. |
| `first_active_month` | VARCHAR | 74 | 0.0% | Account open month YYYY-MM; append '-01' for date parsing. |
| `reward_program` | VARCHAR | 3 | 0.0% | Card reward tier/product type; static at account open. |
| `latitude` | DOUBLE | 17,863 | 0.0% | Billing address lat — NAME COLLISION with merchant_info.latitude; alias card_lat on join. |
| `longitude` | DOUBLE | 29,443 | 0.0% | Billing address lon — NAME COLLISION with merchant_info.longitude; alias card_lon on join. |
| `fico_score` | BIGINT | 551 | 0.0% | Credit score; AMBIGUOUS — continuously updated, snapshot date unknown. |
| `age` | BIGINT | 83 | 0.0% | Cardholder age at data snapshot; static demographic. |

### merchant_info.csv  (70,086 rows)

| Column | Type | Cardinality | Null Rate | Interpretation |
|---|---|---|---|---|
| `merchant_id` | VARCHAR | 70,086 | 0.0% | FK → merchant_info; many transactions per merchant. |
| `merchant_category_id` | BIGINT | 269 | 0.0% | MCC numeric code; matches merchant_info.merchant_category_id. |
| `subsector_description` | VARCHAR | 38 | 0.0% | Human-readable MCC category label. |
| `latitude` | DOUBLE | 19,981 | 0.0% | Billing address lat — NAME COLLISION with merchant_info.latitude; alias card_lat on join. |
| `longitude` | DOUBLE | 38,032 | 0.0% | Billing address lon — NAME COLLISION with merchant_info.longitude; alias card_lon on join. |

> **Coordinate collision:** Both `cardholder_info` and `merchant_info` carry `latitude` and `longitude`. All joins must alias them as `card_lat`/`card_lon` and `merch_lat`/`merch_lon` to avoid column overwrites.

## 7. Temporal Triage

Legend: **T** = transaction-time (safe for features) | **P** = post-determination (EXCLUDE unconditionally) | **A** = ambiguous (EXCLUDE by default)

| Source | Column | Verdict | Justification |
|---|---|---|---|
| transactions.csv | `transaction_id` | T — transaction-time | Synthetic PK generated at authorization time; carries no fraud information. |
| transactions.csv | `authorized_flag` | **P — post-determination** | THE LABEL ITSELF — encodes the fraud/not-fraud determination; excluded from features unconditionally. |
| transactions.csv | `purchase_date` | T — transaction-time | Timestamp of the authorization event; exists before any fraud determination. |
| transactions.csv | `card_id` | T — transaction-time | Card identifier presented at the terminal; known at transaction time. |
| transactions.csv | `merchant_id` | T — transaction-time | Merchant identifier at point of sale; known at transaction time. |
| transactions.csv | `merchant_category_id` | T — transaction-time | MCC is assigned to the merchant before any transaction; static merchant attribute. |
| transactions.csv | `item_category` | T — transaction-time | Merchant-side product category set at authorization; not derived from fraud outcome. |
| transactions.csv | `purchase_amount` | T — transaction-time | Dollar amount requested at the terminal; exists at authorization time. |
| transactions.csv | `signature_provided` | T — transaction-time | Cardholder signature capture flag recorded at POS before authorization outcome. |
| cardholder_info.csv | `card_id` | T — transaction-time | Join key linking to transactions; static account identifier. |
| cardholder_info.csv | `first_active_month` | T — transaction-time | Account open month (YYYY-MM); precedes any transaction and is never updated post-determination. |
| cardholder_info.csv | `reward_program` | T — transaction-time | Card product type enrolled at account opening; static cardholder attribute set before any fraud event. |
| cardholder_info.csv | `latitude` | T — transaction-time | Cardholder billing address coordinates; static demographic independent of fraud determination. (Alias to card_lat on join.) |
| cardholder_info.csv | `longitude` | T — transaction-time | Cardholder billing address coordinates; static demographic independent of fraud determination. (Alias to card_lon on join.) |
| cardholder_info.csv | `fico_score` | *A — ambiguous* | AMBIGUOUS — FICO scores are continuously updated by credit bureaus; a score pulled after fraud events on this card may encode the fraud outcome. Excluded by default pending confirmation of snapshot date. |
| cardholder_info.csv | `age` | T — transaction-time | Cardholder age at data snapshot; static demographic with no fraud feedback loop. |
| merchant_info.csv | `merchant_id` | T — transaction-time | Join key; static merchant identifier. |
| merchant_info.csv | `merchant_category_id` | T — transaction-time | MCC assigned at merchant onboarding; does not change based on fraud outcomes. |
| merchant_info.csv | `subsector_description` | T — transaction-time | Human-readable MCC label; static registry attribute set at merchant enrollment. |
| merchant_info.csv | `latitude` | T — transaction-time | Merchant physical location; static, does not reflect fraud history. (Alias to merch_lat on join.) |
| merchant_info.csv | `longitude` | T — transaction-time | Merchant physical location; static, does not reflect fraud history. (Alias to merch_lon on join.) |

**Triage summary:** 19 transaction-time | 1 post-determination excluded | 1 ambiguous excluded

### Key triage decisions

- **`authorized_flag`** (transactions.csv) — THE LABEL. Excluded from features unconditionally. Its NULL rate (22% of rows) is informative and noted for Phase 2 quality analysis.
- **`fico_score`** (cardholder_info.csv) — Classified AMBIGUOUS. FICO is continuously updated by credit bureaus. A score pulled after fraud events on this account may encode fraud-related credit deterioration. Without a confirmed snapshot date predating all transactions, this column is excluded by default. If the data team confirms scores were pulled at account open and never refreshed, reclassify as transaction-time.

---

*Phase 1 complete. Proceed to `phase_02_data_quality.md`.*
