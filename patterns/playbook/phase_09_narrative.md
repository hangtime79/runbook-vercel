# Phase 9: Narrative — The Written Deliverable

**Load this file when:** dashboard is built and you're writing the analytical brief.
**Prerequisites:** `phase_08_dashboard.md`, plus findings from `phase_05_pattern_discovery.md` and SHAP results from `phase_07_interpretability.md`.
**Next:** `phase_10_self_assessment.md`. If findings aren't actionable, re-load `phase_05_pattern_discovery.md` and push harder.

The narrative is a structured written document that accompanies the dashboard. It's what the data scientist reads before the meeting, takes into the meeting, and refers back to after the meeting. It is not a technical report — it's an analytical brief.

---

## Structure

### 1. Executive Summary (3–5 sentences)

What the data covers, the overall fraud rate, and the single most important finding. A time-pressed reader who reads nothing else should walk away knowing the one thing that matters most.

### 2. Data Overview

What was provided, what time range it covers, the grain, the class balance, and any data quality issues that affect interpretation. Include the temporal triage outcome — which columns were excluded and why. This is the "trust calibration" section — it tells the reader how much to trust everything that follows.

### 3. Key Findings

The five (or more) findings from Phase 5 and the SHAP analysis, written for a non-technical business audience. Each finding should follow this structure:

- **What we found** — the pattern, stated plainly with numbers
- **Why it matters** — the operational or business implication
- **What to do about it** — a specific action: investigate these merchants, adjust this rule threshold, monitor this cardholder segment, escalate this pattern to the network

**Example of a weak finding:** "Micro-transactions show elevated fraud rates."
**Example of a strong finding:** "Transactions under $10 have a fraud rate of 18.7% — double the portfolio baseline of 9.5%. This pattern is consistent with card testing: attackers run small charges to confirm a stolen card is live before attempting larger purchases. The top 5 merchants by micro-transaction fraud volume are [X, Y, Z]. Recommend: add a velocity rule that flags cardholders with 3+ transactions under $10 within 30 minutes for real-time review."

Every finding must look like the strong example. If it looks like the weak example, it's not finished.

### 4. Model Summary

What the model can and cannot do, stated honestly. Its discrimination power (AUC with confidence interval from K-Fold), its top features, and what additional data would improve it. Frame this as capability, not as a grade.

### 5. Recommendations

Concrete next steps ranked by expected impact. These should connect directly to the findings. If Finding #2 identified a compromised merchant cluster, Recommendation #2 should be "Investigate merchants X, Y, Z — their combined fraud rate is 47% across 312 transactions in the analysis window."

### 6. Limitations and Caveats

What the analysis can't tell you. What the data doesn't contain. Where the findings might not generalize. What columns were excluded as ambiguous and might contain useful signal if their provenance can be confirmed. This section builds credibility — an analysis that claims no limitations is an analysis that can't be trusted.

---

## Tone

Direct, precise, and confident where the data supports confidence. Measured and honest where it doesn't. No hedging for the sake of hedging, no overclaiming for the sake of impact. Write as if the reader is smart, busy, and will act on what you say — so you'd better be right.

---

**Exit criteria:** Six-section narrative written, every finding in the strong-example form, limitations section present. Proceed to `phase_10_self_assessment.md`.
