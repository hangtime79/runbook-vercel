# Phase 1: Orientation — What landed on my desk?

**Load this file when:** starting analysis on a new dataset, before any code runs.
**Prerequisites:** Operating Principles (router).
**Next:** `phase_02_data_quality.md`.

Before touching the data, answer these questions. The answers shape every decision downstream.

---

## 1.1 Structural questions

- **Grain.** What does one row represent? One transaction? One authorization attempt? One dispute? If you're wrong about the grain, every count and rate you compute is wrong.
- **Label.** Find the fraud indicator column. Identify every distinct value — not just fraud/not-fraud. Watch for third states: pending, disputed, under review, unknown. These are unresolved cases. Count them, report their distribution across key dimensions, then exclude them from modeling. Their distribution is itself a finding — disputes concentrate where fraud concentrates.
- **Join keys.** Which columns link tables together? Check cardinality before joining. A transaction has one cardholder; a cardholder has many transactions. If your row count changes after a join, you have a fan-out. Stop and fix it before proceeding.
- **Time range.** What calendar window does the data cover? Days, weeks, months? Fraud patterns shift seasonally and with external events (data breaches, holiday shopping, stimulus payments). Know your window and note it in the narrative.

---

## 1.2 Class balance assessment

Compute the overall fraud rate. This number calibrates everything that follows.

| Observed Rate | Likely Interpretation | Modeling Implication |
|---|---|---|
| < 1% | Typical production portfolio | Severe class imbalance — precision-recall matters more than accuracy. Stratified splitting is mandatory. Consider `scale_pos_weight` in XGBoost. |
| 1–5% | Normal for card-not-present or enriched dataset | Standard approach. Stratified split. |
| 5–15% | Enriched sample, troubled subsegment, or pre-filtered data | Check whether the dataset has been pre-filtered to suspicious transactions. This changes your base rate assumptions. |
| > 15% | Almost certainly a curated dataset or a specific investigation file | Treat findings as specific to this population, not generalizable to the full portfolio. Note this prominently in the narrative. |

---

## 1.3 Initial schema inventory

List every column with its type, cardinality, null rate, and a one-line interpretation. This inventory is reference material for every subsequent phase. If a column's purpose isn't obvious, note that — ambiguous columns are where silent errors hide.

---

## 1.4 Temporal triage — MANDATORY before any feature engineering

**This step prevents label leakage. Do not skip it. Do not defer it.**

For every column in the dataset, classify it into one of three categories:

| Category | Definition | Action |
|---|---|---|
| **Transaction-time** | Data that existed at the moment the transaction was authorized. Examples: amount, merchant ID, timestamp, cardholder address, card type, merchant category code. | Available for feature engineering and modeling. |
| **Post-determination** | Data that was populated after the fraud/not-fraud label was assigned. Examples: dispute status, chargeback indicator, investigation outcome, resolution date, fraud type classification, recovery amount. | **EXCLUDE from features unconditionally.** These encode the label. Using them produces artificially high AUC and a model that cannot be deployed. |
| **Ambiguous** | You cannot determine when this column was populated. Examples: columns with unclear names, derived fields without documentation, flags without metadata. | **EXCLUDE by default.** It is better to lose a potentially useful feature than to leak the label. Note the excluded column and the reason in the narrative. |

**Hard rule:** If you cannot confidently classify a column as transaction-time, it does not enter the feature set. No exceptions. An AUC penalty from excluding a legitimate feature is recoverable. An AUC inflation from including a leaked feature is invisible until the model fails in production.

**Verification check:** After building your feature set in Phase 4, review every feature against this triage. If any feature derives from or correlates with a post-determination column, remove it. Common subtle leaks:
- A "days to resolve" field that's only populated for fraud cases
- A merchant risk score that was computed using the same fraud labels you're predicting
- A flag column that's null for legitimate transactions and populated for fraud (the null pattern itself leaks the label)

---

**Exit criteria:** You have grain, label states, join keys, time window, overall fraud rate, schema inventory, and every column classified into the three triage buckets. Proceed to `phase_02_data_quality.md`.
