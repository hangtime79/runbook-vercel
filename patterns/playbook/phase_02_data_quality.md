# Phase 2: Data Quality — Trust but verify

**Load this file when:** Phase 1 orientation is complete and you're ready to interrogate the raw tables.
**Prerequisites:** `phase_01_orientation.md` (especially §1.4 temporal triage).
**Next:** `phase_03_golden_record.md`.

Every dataset lies about something. Your job is to find what, quantify the impact, and fix what's fixable.

---

## 2.1 Mandatory checks

**Dates and timestamps.** Check format consistency. Mixed formats within a single column are common and will silently produce wrong values. Truncated dates (year-month without day) will crash parsers — pad them. Timestamps without timezone metadata should be assumed to be in a single timezone; note the assumption. Parse dates early and validate ranges — transactions dated in 1970 or 2099 are parse failures masquerading as data.

**Coordinates.** If multiple tables contain latitude/longitude columns, alias them explicitly before joining: `cardholder_lat`, `cardholder_long`, `merchant_lat`, `merchant_long`. Unaliased coordinate joins produce ambiguous columns and silent wrong answers in every distance calculation downstream. This is the single most common data error in payment fraud datasets with geographic data.

**Nulls.** Compute null rates per column. Then compute null rates per column *conditional on fraud status*. If nulls concentrate in fraudulent transactions, that's not missing data — it's a signal. Fraudulent transactions often have missing fields because the data was fabricated or the cardholder info was incomplete. Report the differential null pattern before deciding how to handle nulls.

**But also check:** If a column is null *only* for legitimate transactions and populated *only* for fraud (or vice versa), that column is almost certainly post-determination. Go back to §1.4 in `phase_01_orientation.md` and reclassify it. This is a common leakage vector that presents as a null pattern.

**Negative and zero amounts.** These are refunds, reversals, and authorization holds. Count them. Compute their fraud rate. Typically they run at or near baseline and can stay in the dataset — the model handles them. But if their fraud rate is anomalous, that's a finding worth investigating (refund fraud, reversal abuse).

**Categorical cardinality.** For every categorical column, count distinct values. High-cardinality fields (hundreds of merchant categories, thousands of merchant IDs) need encoding strategy decisions. Low-cardinality fields (3–10 values) can be one-hot encoded. Note which is which — you'll need this in feature engineering.

---

## 2.2 Reactive checks

These are checks you run based on what you see:

- **If you find duplicate transaction IDs:** Determine whether they're true duplicates (identical rows) or fan-outs from a bad join. True duplicates get deduplicated. Fan-outs mean your join logic is wrong — go back to Phase 1 and fix the key.
- **If you find extreme outlier amounts:** Check whether they're data errors or legitimate high-value transactions. A $50,000 charge on a card with a $2,000 average could be fraud, a data error, or a legitimate luxury purchase. Don't drop outliers reflexively — flag them and let the model see them.
- **If null rates exceed 30% on a column:** Assess whether the column is usable. A column that's 40% null can still be valuable if the nulls are informative (as above). A column that's 40% null and random is adding noise, not signal.

---

## 2.3 Quality verdict

After these checks, write a short data quality assessment: what's clean, what required fixing, what assumptions you made, and what limitations the data imposes on downstream analysis. This goes into the narrative.

---

**Exit criteria:** Every mandatory check executed, reactive checks run where conditions triggered, and a written quality verdict ready for the narrative. Proceed to `phase_03_golden_record.md`.
