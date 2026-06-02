# Phase 5: Pattern Discovery — The Investigation Loop

**Load this file when:** features are built and you're ready to hunt for findings — or when Phase 7 SHAP disagreement sends you back to explore deeper.
**Prerequisites:** `phase_04_feature_engineering.md`.
**Next:** `phase_06_model_building.md`, or loop back to `phase_04_feature_engineering.md` if any §5.6 trigger fires.

This is the analytical core of the playbook. You're not computing descriptive statistics — you're hunting for what's surprising, because surprises are findings and findings are the deliverable.

---

## 5.1 Systematic fraud rate cuts

Slice fraud rate across every available dimension:

- Hour of day
- Day of week
- Amount buckets (design the buckets to isolate micro-transactions, normal range, and high-value)
- Credit score bands (if available)
- Merchant category
- Distance buckets
- Velocity windows
- Verification/signature status
- Any other categorical dimension in the data

Most of these cuts will confirm expected patterns. **The ones that don't are your findings.** When a cut surprises you, quantify it precisely and investigate further.

**After completing all cuts:** Rank every dimension by the range of fraud rate variation it shows (max fraud rate minus min fraud rate across its buckets). The top 3–5 dimensions by variance are where you spend the rest of your Phase 5 effort. Dimensions with flat fraud rate profiles across all buckets get noted as "no signal" and you move on. Do not spend equal time on every dimension.

---

## 5.2 Non-linear relationship hunting

Look specifically for these — they're common in card fraud and they're the findings that change how investigators think:

- **The micro-transaction spike.** Fraud rate on transactions under $5–10 is often *higher* than fraud rate on transactions over $500, because card testing uses amounts that won't trigger alerts. If you find this, it's a major finding.
- **Score U-curves.** If credit scores are available, check whether fraud rate is U-shaped (elevated at both extremes) rather than monotonically declining. High-score cardholders are high-value targets.
- **Distance paradoxes.** Very short distances (local transactions) sometimes show *higher* fraud rates than moderate distances, because local fraud can originate from the cardholder's own area (data breaches at local merchants, physical card theft).
- **Velocity thresholds.** Fraud rate doesn't increase linearly with velocity — it typically shows a step function. Find the threshold where it jumps. That threshold becomes an operational rule.

---

## 5.3 Entity-level aggregation

Roll up fraud rate to the merchant level (or merchant category level, or any entity level available). Look for:

- **Compromised merchants.** Individual merchants with fraud rates dramatically above baseline (30%+) are either compromised terminals or potentially complicit operations. These aren't model features — they're investigation leads. Name them in the narrative.
- **Category concentration.** Some merchant categories carry structurally higher fraud rates. Quantify the spread.

---

## 5.4 Interaction effects

Single features tell you what's unusual. Interactions tell you what's *suspicious*. Test combinations:

- High velocity + high amount deviation = card testing escalating to extraction
- Off-hours + missing verification + high amount = opportunistic fraud
- High distance + high velocity = impossible travel
- First transaction + high amount = stolen card first use

When you find an interaction that dramatically outperforms its components, note the multiplier. "Fraud rate when both velocity > 5/hour AND amount deviation > 3x is 42%, versus 12% for high velocity alone and 8% for high amount deviation alone" — that's the kind of finding that changes how a rules engine is configured.

---

## 5.5 Known fraud typologies

Check explicitly for evidence of these card fraud patterns:

| Typology | What to look for | Key features |
|---|---|---|
| Card testing | Micro-transactions in rapid sequence across diverse merchants | Velocity + low amount + merchant diversity |
| Account takeover | Sudden behavioral deviation on an established, previously low-risk card | Amount deviation + card age + velocity change |
| Merchant compromise | Concentrated fraud at a single merchant or small merchant cluster | Entity-level fraud rate aggregation |
| Impossible travel | Consecutive transactions requiring faster-than-possible movement | Geographic distance ÷ time gap |
| Bust-out | Gradual credit building followed by a sudden large spend and disappearance | Card age + amount escalation pattern |

Not all typologies will be visible in every dataset. Check for them, note which ones are present, note which ones the data can't detect (and why), and move on.

---

## 5.6 Iteration triggers — MANDATORY checks

After completing your first pass through §5.1–5.5, execute these checks. Each one is a conditional gate. If the condition is true, you must take the action before proceeding to Phase 6. **When any trigger fires, re-load `phase_04_feature_engineering.md` before building the new feature.**

**Trigger 1: Merchant concentration.** IF any individual merchant shows fraud rate > 3× the portfolio baseline, THEN return to Phase 4 and engineer a `merchant_fraud_rate` feature (fraud count / total count for each merchant, computed on training data only to avoid leakage). Add it to the golden record. Re-run §5.3 with the new feature.

**Trigger 2: Amount threshold.** IF fraud rate in any amount bucket is > 2× the rate in adjacent buckets (a spike, not a trend), THEN return to Phase 4 and engineer a binary feature at that threshold (e.g., `is_micro_transaction` for amounts under $10). Re-run §5.1 amount cuts.

**Trigger 3: Interaction multiplier.** IF any two-feature interaction produces fraud rate > 3× the rate of either feature alone, THEN return to Phase 4 and engineer an explicit interaction feature (multiply or combine the two features). Add it to the feature set.

**Trigger 4: Temporal pattern.** IF fraud rate for any hour-of-day or day-of-week bucket is > 2× baseline, THEN return to Phase 4 and engineer a binary `high_risk_window` feature for that time period. If the hour × day interaction is stronger than either component, engineer the interaction explicitly.

**Trigger 5: Velocity step function.** IF you identify a velocity threshold where fraud rate jumps (not gradually increases), THEN return to Phase 4 and engineer a binary feature at that threshold (e.g., `velocity_above_5_per_hour`).

After executing any triggered loops, proceed to Phase 6. Do not loop more than twice — diminishing returns set in fast.

---

**Exit criteria:** Every dimension cut, top 3–5 high-variance dimensions investigated, non-linear patterns and interactions checked, typologies inventoried, §5.6 triggers evaluated (and loops executed if fired). Proceed to `phase_06_model_building.md`.
