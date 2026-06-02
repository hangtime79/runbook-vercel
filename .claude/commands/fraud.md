---
description: Run the card-fraud playbook end-to-end (mechanical phases as subagents, judgment phases inline)
argument-hint: [full | stop-after-N | resume]
---

You are the orchestrator for the card-fraud analysis. Execute the playbook at `patterns/transaction_fraud_playbook.md` now. Do not ask for confirmation — the user invoked `/fraud` to skip the prompt.

## Scope

`$ARGUMENTS` (default: `full`)

- `full` — Phases 1–10, including the §5.6 iteration loop (max 2).
- `stop-after-N` — run through Phase N and stop. Report what's in `artifacts/`.
- `resume` — inspect `artifacts/` first; skip any phase whose output already exists and is non-empty; continue from the first missing phase.

## Execution model

**Mechanical / sonnet-tier phases run as subagents** (1, 2, 3, 4, 7, 8) — they absorb script-iteration chatter and return compact summaries.

**Judgment / opus-tier phases run INLINE on the main thread** (5, 6, 9, 10) — you are already opus, so spawning another opus subagent for judgment work doubles token cost, moves the trigger list / diagnostic verdicts away from where they're needed, and adds a subagent-spawn failure surface. Do these yourself, reading the phase file directly and writing scripts/artifacts from the main thread.

Do **not** spawn `fraud-patterns` or `fraud-model` — those agents are deprecated for this orchestration. Phases 5 and 6 are main-thread work.

## Execution steps

1. Run `uv sync` to prep the environment.
2. Spawn subagents for the mechanical phases in order:
   - `fraud-orientation` → `artifacts/orientation.md`
   - `fraud-quality` → `artifacts/quality.md`
   - `fraud-golden-record` → `artifacts/golden_record.parquet`
   - `fraud-features` → `artifacts/features.parquet` + `features_schema.md`
3. **Phase 5 (inline):** read `patterns/playbook/phase_05_pattern_discovery.md`, write `scripts/phase05_pattern_discovery.py`, execute it via `uv run python3`, interpret the results, and write `artifacts/findings.md` with ≥5 quantified findings plus a `TRIGGERS:` block.
4. **Iteration loop (§5.6):** if your Phase 5 analysis fires any trigger (`merchant_concentration`, `amount_spike`, `interaction_multiplier`, `temporal_pattern`, `velocity_step`), re-spawn `fraud-features` in incremental mode to add the specified feature, then **re-run Phase 5 inline** to verify the new signal. Max 2 loops total across all triggers.
5. **Phase 6 (inline):** read `patterns/playbook/phase_06_model_building.md`, write `scripts/phase06_model_building.py`, execute it, interpret the §6.5 diagnostics (AUC, K-Fold std, confusion matrix), and write `artifacts/model.pkl` + `artifacts/metrics.md`.
6. Spawn subagent for Phase 7: `fraud-shap` → `artifacts/shap_values.npz` + `shap.md`.
7. Spawn subagent for Phase 8: `fraud-dashboard` → verifies artifacts and launches `dashboard/fraud_analysis_app.py` on port 8501.
8. **Phase 9 (inline):** write `NARRATIVE.md` yourself.
9. **Phase 10 (inline):** run the self-assessment checklist from `patterns/playbook/phase_10_self_assessment.md`.

## Subagent input contract (applies only when spawning)

Each subagent prompt must include:
- Path to its phase file (`patterns/playbook/phase_XX_*.md`).
- Paths to upstream artifacts it depends on.
- Exact artifact paths it must write.
- Any run-specific notes (e.g., "incremental mode — add `merchant_fraud_rate` only").

## Diagnostic gates (main-thread enforces)

- **AUC > 0.85** from your inline Phase 6 → likely leakage. Re-examine §1.4 temporal triage: re-spawn `fraud-orientation`, re-spawn `fraud-features`, then re-run Phase 6 inline. Do not proceed to Phase 7 until resolved.
- **AUC < 0.62 AND §5.6 triggers were skipped** → re-run Phase 5 inline, re-spawn `fraud-features`, then re-run Phase 6 inline.
- **SHAP top-3 ≠ univariate top-3** (from Phase 7 subagent summary vs. your Phase 5 variance ranking) → investigate and note the disagreement in `NARRATIVE.md` before dashboard launch.

## Main-thread discipline

- Subagents return ≤200-word summaries. Do not ask them for dataframe dumps.
- State flows through `artifacts/`. The main thread holds: phase status, trigger list, diagnostic verdicts, loop count.
- Report progress to the user between phases in one sentence each ("Phase 3 done — golden_record.parquet written, 327K rows").
- Scripts for inline phases go in `scripts/` — same rule as subagent-written scripts. Never `python -c`. Write-then-run.
- At the end: confirm dashboard is running, summarize key findings and model metrics in 3–5 bullets, and point to `NARRATIVE.md`.
