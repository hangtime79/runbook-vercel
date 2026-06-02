# Phase 3: The Golden Record

**Load this file when:** Phase 2 quality verdict is written and you are ready to assemble the analytical table.
**Prerequisites:** `phase_01_orientation.md` (§1.4 triage decisions), `phase_02_data_quality.md` (coord aliasing, date parsing rules).
**Next:** `phase_04_feature_engineering.md`.

Join everything into a single analytical table. One row per transaction, fully enriched with cardholder and merchant attributes.

---

## Rules

- **LEFT JOIN from transactions outward.** Every transaction survives even if its cardholder or merchant record is missing. Missing enrichment data is preferable to dropped transactions.
- **Alias colliding columns during the join, not after.** If both tables have `latitude`, rename them in the SELECT/join statement. Post-hoc renaming after a merge is fragile and produces silent errors when column order changes.
- **Parse dates during the join.** Don't leave date parsing for later — you need datetime types for feature engineering.
- **Validate row count.** `count(golden_record)` must equal `count(transactions)`. Any deviation means a join key problem. Stop and fix it. Do not proceed with a row count mismatch.
- **Prefer SQL-style operations over dataframe merges** where available, especially when multiple tables share column names. Suffix-based merge behavior (`_x`, `_y`) creates naming chaos that compounds across the analysis.
- **Exclude post-determination columns from the golden record.** The temporal triage from §1.4 determines which columns survive into this table. Carry the label column and the transaction-time columns. Leave everything else behind. It's easier to never include a leaky column than to remember to exclude it later.

---

**Exit criteria:** Golden record built, row count verified equal to transactions, only transaction-time columns + label present, colliding columns aliased. Proceed to `phase_04_feature_engineering.md`.
