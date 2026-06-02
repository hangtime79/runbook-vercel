# Phase 10: Self-Assessment — Before you ship

**Load this file when:** dashboard and narrative are complete and you're ready to finalize.
**Prerequisites:** `phase_09_narrative.md`.
**Next:** ship — or return to the phase flagged by whichever question failed.

Before finalizing the deliverable, answer these questions honestly:

1. **Did the row count survive every join?** If you can't confirm this, your rates and counts may be wrong. → `phase_03_golden_record.md`.
2. **Did every feature pass the temporal triage from §1.4?** Verify — don't assume. Print the feature list and check each one. → `phase_01_orientation.md` §1.4.
3. **Do the SHAP rankings agree with the univariate analysis?** Disagreements aren't errors — they're interaction effects. But you should be able to explain every major disagreement. → `phase_07_interpretability.md` §7.1.
4. **Would a fraud investigator read the narrative and want to do something different tomorrow morning?** If the answer is no, your findings aren't actionable enough. Go back to Phase 5. → `phase_05_pattern_discovery.md`.
5. **Is there a finding you're surprised by?** If everything confirmed your priors, you either have a very well-understood portfolio or you didn't look hard enough. Push on one more dimension before shipping. → `phase_05_pattern_discovery.md`.

---

**Exit criteria:** All five questions answered honestly. Any "no" answer triggers the corresponding phase re-read. When all five pass, ship.
