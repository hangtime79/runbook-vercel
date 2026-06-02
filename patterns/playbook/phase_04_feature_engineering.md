# Phase 4: Feature Engineering

**Load this file when:** the golden record exists and you are ready to build features — or when a Phase 5.6 iteration trigger has fired and sent you back.
**Prerequisites:** `phase_03_golden_record.md` (golden record ready), `phase_01_orientation.md` §1.4 (triage — every feature must derive only from transaction-time data).
**Next:** `phase_05_pattern_discovery.md`.

This is where domain knowledge meets the data. These feature families are ordered by typical predictive power in card fraud, but your dataset will have its own hierarchy. Build them all, then let the model and SHAP tell you what matters most *in this data*.

**Before building any feature, confirm it derives only from transaction-time data (§1.4 in `phase_01_orientation.md`).** If a feature requires a post-determination column as input, do not build it.

---

## 4.1 Velocity features — build these first

Velocity is consistently the strongest feature class in card transaction fraud. If you could build only one feature family, build this one.

- **Time since last transaction** for this cardholder. Rapid-fire sequences (under 5 minutes between transactions) are the signature of card testing — small charges to confirm the card is live before a large fraudulent purchase.
- **Transaction count in rolling windows.** 1-hour and 24-hour windows. Normal cardholders rarely make more than 2–3 purchases in an hour. Compromised cards show bursts of 5–10+.
- **Amount velocity.** Total spend in the last hour and last 24 hours for this cardholder. A cardholder who normally spends $200/day suddenly accumulating $3,000 in two hours is a velocity signal that transaction count alone won't capture.

**Implementation note on rolling windows:** When computing rolling features (transaction count in last hour, spend in last 24 hours), you must compute them using only *past* transactions for each cardholder — not future ones. Sort by cardholder and timestamp, then use backward-looking windows only. A rolling window that includes the current transaction or future transactions leaks information the model wouldn't have at authorization time.

---

## 4.2 Temporal features

- **Hour of day** from the transaction timestamp. Fraud concentrates in off-hours — not because criminals are nocturnal, but because monitoring systems are thinner and dispute resolution is slower.
- **Day of week.** Weekend transactions often show different fraud profiles than weekday transactions.
- **Hour-day interaction.** Saturday at 3 AM is a different risk profile than Tuesday at 3 PM. If your data has enough volume, this interaction feature adds signal beyond the individual components.

---

## 4.3 Geographic features

- **Haversine distance** between cardholder home location and merchant location. Distance alone is a moderate signal — people travel. But distance combined with velocity is where the real signal lives.
- **Impossible travel flag.** If the distance between consecutive transactions divided by the time between them implies travel speed exceeding plausible limits (say, 800+ km/h), flag it. This is one of the few features that's nearly binary in its fraud signal.

---

## 4.4 Behavioral deviation features

- **Amount deviation.** Current transaction amount divided by the cardholder's historical rolling mean and/or median. A ratio of 5x+ (spending 5 times their average) is a strong behavioral break. Use only prior transactions for the rolling average — including the current transaction in its own baseline is a subtle leak.
- **First-transaction indicator.** Is this the first transaction on this card in the dataset? New-to-card transactions carry higher fraud rates because stolen card numbers are tested early.
- **Card age.** Months since first transaction in the dataset (or since card issuance if available). Very new cards and very old dormant cards are compromised through different attack vectors. This feature often shows a non-linear relationship with fraud.

---

## 4.5 Account and identity features

Build whatever the data gives you. Common candidates:

- **Credit score bands** (if available). Don't assume a linear relationship. High-score cardholders are targeted because their limits are higher and their monitoring may be less aggressive.
- **Signature or verification indicators** (if available). Unsigned or unverified transactions consistently show elevated fraud rates across portfolios.
- **Card type or product indicators.** Different card products have different risk profiles.

---

## 4.6 Categorical encoding

Encode categorical fields as numeric values. Low-cardinality fields (under ~15 values) can be one-hot encoded. High-cardinality fields should be label encoded or frequency encoded. Don't target-encode without cross-validation — it leaks.

---

## 4.7 Adaptation rule

**If Phase 5 reveals a pattern you didn't engineer a feature for, come back here and build one.** This is not optional. The specific triggers are listed in `phase_05_pattern_discovery.md` §5.6.

**Target: 12–20 features.** Enough to capture the signal structure, not so many that you're fitting noise. But this is a guideline — if the data justifies 25, build 25.

---

**Exit criteria:** 12–20 features built, every feature verified transaction-time, rolling windows verified backward-looking only, amount deviation baseline excludes the current transaction. Proceed to `phase_05_pattern_discovery.md`.
