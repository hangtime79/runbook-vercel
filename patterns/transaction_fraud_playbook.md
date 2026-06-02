# Card Transaction Fraud Analysis Playbook — Orchestration Router

**Autonomous Analytical Methodology — Card Payments (v3.2, hybrid inline-judgment)**

This router tells the main thread how to run the fraud analysis. Mechanical phases run in subagents; judgment phases run inline on the main thread. Each subagent reads its own phase file, does the work, writes artifacts to `artifacts/`, and returns a short structured summary. Inline phases follow the same phase files, but the main thread writes scripts, runs them, and produces the artifacts directly.

**Why this structure.** Subagents absorb debug chatter, dataframe dumps, and script iteration — valuable for mechanical work where the orchestrator doesn't need to see the loop. But for **judgment phases** (pattern discovery, model diagnostics, narrative), the orchestrator is already opus-tier, and spawning another opus subagent would both double the token cost and move the trigger list / diagnostic verdicts away from where they're held. So the main thread owns 5, 6, 9, 10 directly. Cheap models handle mechanical phases; the orchestrator handles judgment. See §2 for the tier rationale.

---

## 1. Operating Principles (main thread holds these)

**Autonomous analyst, not a pipeline.** When a finding surprises you, engineer a feature around it and test. When a dimension is flat, move on. Allocate compute where the signal is.

**Every claim needs a number.** Findings are quantified or they aren't findings.

**Two audiences.** Dashboard is for investigators. Narrative is for the data scientist walking into a meeting. Both must be excellent.

**Good, not perfect.** 0.68 AUC with a clear story beats 0.72 with no story. Spend tokens on findings, not hyperparameter tuning.

**State flows through files.** Agents return summaries, not dataframes. All dataset state lives in `artifacts/`. This is what keeps the main thread context small.

---

## 2. The Phase Agents

| # | Phase | Executor | Model | Writes |
|---|---|---|---|---|
| 1 | Orientation | `fraud-orientation` subagent | sonnet | `artifacts/orientation.md` |
| 2 | Data Quality | `fraud-quality` subagent | haiku | `artifacts/quality.md` |
| 3 | Golden Record | `fraud-golden-record` subagent | haiku | `artifacts/golden_record.parquet` |
| 4 | Feature Engineering | `fraud-features` subagent | sonnet | `artifacts/features.parquet`, `artifacts/features_schema.md` |
| 5 | Pattern Discovery | **main thread (opus)** | — | `artifacts/findings.md` |
| 6 | Model Building | **main thread (opus)** | — | `artifacts/model.pkl`, `artifacts/metrics.md` |
| 7 | Interpretability | `fraud-shap` subagent | sonnet | `artifacts/shap_values.npz`, `artifacts/shap.md` |
| 8 | Dashboard | `fraud-dashboard` subagent | haiku | launches `fraud_analysis_app.py` |
| 9 | Narrative | **main thread (opus)** | — | `NARRATIVE.md` |
| 10 | Self-Assessment | **main thread (opus)** | — | (inline verdict) |

**Why this tiering:**
- **Main thread (opus) on 5, 6, 9, 10.** Pattern discovery requires judgment about what's surprising. Model diagnostics require interpreting AUC/SHAP signals against the temporal triage. Narrative synthesis is the actual deliverable. Self-assessment is a final check. The orchestrator is already opus — spawning another opus subagent for these would both double token cost and move the trigger list / diagnostic verdicts away from where they're held. Do them inline, from the main thread, reading each phase file directly and writing scripts/artifacts via `scripts/` just like a subagent would.
- **Sonnet subagents on 1, 4, 7.** §1.4 temporal triage is the single highest-stakes judgment — a missed leak is invisible until production. Feature engineering has design choices. SHAP disagreement analysis needs to reason about interaction effects. Subagents here absorb script-iteration chatter while still having enough capability for the judgment calls within their scope.
- **Haiku subagents on 2, 3, 8.** Quality checks are counting and thresholding. Joins are mechanical. Dashboard launches a prebuilt skeleton.

**Deprecated subagents.** The `fraud-patterns` and `fraud-model` agents are **not shipped and not invoked** by this orchestration. Phases 5 and 6 are always main-thread.

---

## 3. Orchestration Flow

```
START
 ├─ Spawn fraud-orientation          → artifacts/orientation.md
 ├─ Spawn fraud-quality              → artifacts/quality.md
 ├─ Spawn fraud-golden-record        → artifacts/golden_record.parquet
 ├─ Spawn fraud-features             → artifacts/features.parquet
 ├─ Main thread runs Phase 5 INLINE  → artifacts/findings.md + triggers[]
 │   └─ IF triggers fired (merchant/amount/interaction/temporal/velocity):
 │       ├─ Spawn fraud-features (incremental mode) to add the triggered feature
 │       └─ Main thread re-runs Phase 5 INLINE to verify the new signal
 │       (max 2 iteration loops)
 ├─ Main thread runs Phase 6 INLINE  → artifacts/model.pkl + metrics.md + diagnostic verdict
 │   ├─ IF AUC > 0.85: re-examine §1.4 triage (likely leakage) — re-spawn fraud-orientation to re-verify, re-spawn fraud-features, then re-run Phase 6 inline
 │   └─ IF AUC < 0.62 AND Phase 5.6 triggers were skipped: re-run Phase 5 inline, re-spawn fraud-features, then re-run Phase 6 inline
 ├─ Spawn fraud-shap                 → artifacts/shap.md + disagreement check
 │   └─ IF top-3 SHAP ≠ top-3 univariate dimensions from Phase 5: investigate before proceeding
 ├─ Spawn fraud-dashboard            → launches Streamlit
 ├─ Main thread writes NARRATIVE.md (Phase 9)
 └─ Main thread runs self-assessment checklist (Phase 10)
END
```

**Loop budget:** Each iteration trigger can fire at most twice. Diminishing returns set in fast.

**Inline phase discipline (5, 6, 9, 10).** Main thread reads the phase file, writes scripts to `scripts/`, runs them via `uv run python3 scripts/<name>.py`, reads the stdout, and produces the artifact. No `python -c`. Same tool-use discipline as a subagent — just without the spawn.

**Subagent input contract** (applies only to phases 1, 2, 3, 4, 7, 8): When spawning, the prompt must include:
- Path to its phase file (`patterns/playbook/phase_XX_*.md`)
- Paths to upstream artifacts it depends on
- The exact artifact paths it must write
- Any run-specific notes (e.g., "incremental mode — add merchant_fraud_rate only")

**Subagent return contract:** Every spawned subagent returns a compact summary:
- What it wrote (artifact paths + sizes)
- Key numbers (row counts, metrics, triggered conditions)
- Anything that changes orchestration (triggers fired, diagnostic verdicts, disagreements)
- ≤200 words, no dataframe dumps

---

## 4. Artifact Contract

All state lives in `artifacts/` at repo root.

| File | Producer | Consumer(s) | Format |
|---|---|---|---|
| `orientation.md` | fraud-orientation subagent | fraud-quality, fraud-golden-record, fraud-features, Phase 5 (main), Phase 6 (main), Phase 9 (main) | Markdown: grain, label states, triage table, class balance, time range |
| `quality.md` | fraud-quality subagent | fraud-golden-record, Phase 9 (main) | Markdown: nulls, coords, cardinality, quality verdict |
| `golden_record.parquet` | fraud-golden-record subagent | fraud-features, Phase 5 (main), dashboard | Parquet: one row per transaction, enriched, transaction-time cols only |
| `features.parquet` | fraud-features subagent | Phase 5 (main), Phase 6 (main), fraud-shap, dashboard | Parquet: feature matrix + label column |
| `features_schema.md` | fraud-features subagent | Phase 5 (main), Phase 9 (main) | Markdown: feature list, descriptions, triage verification |
| `findings.md` | **main thread (Phase 5)** | Phase 6 (main), fraud-dashboard, fraud-shap (as disagreement anchor), Phase 9 (main) | Markdown: 5+ findings in structured form, triggers list |
| `model.pkl` | **main thread (Phase 6)** | fraud-shap, dashboard | Pickle: trained XGBClassifier |
| `metrics.md` | **main thread (Phase 6)** | fraud-shap, Phase 9 (main) | Markdown: AUC (K-Fold mean±std, holdout), PR-AUC, confusion matrix, diagnostic verdict |
| `shap_values.npz` | fraud-shap subagent | dashboard | NumPy: SHAP values + expected_value on 2K sample |
| `shap.md` | fraud-shap subagent | Phase 9 (main) | Markdown: top features, directional summary, disagreement notes |

**Dashboard reads artifacts only.** `fraud_analysis_app.py` is a prebuilt skeleton. It does not call any phase logic.

---

## 5. Iteration Triggers (Phase 5.6 → Phase 4 loop)

When the main thread's Phase 5 analysis fires any of these triggers, it re-spawns `fraud-features` in incremental mode to add the specified feature, then re-runs Phase 5 inline to verify the new signal.

| Trigger | Condition | Feature to add |
|---|---|---|
| `merchant_concentration` | Any merchant with fraud rate > 3× baseline | `merchant_fraud_rate` (training-only) |
| `amount_spike` | Amount bucket fraud rate > 2× adjacent buckets | Binary threshold (e.g., `is_micro_transaction`) |
| `interaction_multiplier` | Two-feature interaction > 3× either alone | Explicit combined feature |
| `temporal_pattern` | Hour/day bucket fraud rate > 2× baseline | `high_risk_window` binary flag |
| `velocity_step` | Velocity threshold with step-function fraud rate | Binary threshold (e.g., `velocity_above_5_per_hour`) |

Max 2 iterations total across all triggers. After the second pass, proceed to Phase 6 even if new triggers fire — diminishing returns dominate.

---

## 6. Phase File Reference

Each executor (subagent or main thread) reads its phase file as its first step. These are the canonical methodology. Do not inline them in agent definitions — single source of truth.

- `patterns/playbook/phase_01_orientation.md`
- `patterns/playbook/phase_02_data_quality.md`
- `patterns/playbook/phase_03_golden_record.md`
- `patterns/playbook/phase_04_feature_engineering.md`
- `patterns/playbook/phase_05_pattern_discovery.md`
- `patterns/playbook/phase_06_model_building.md`
- `patterns/playbook/phase_07_interpretability.md`
- `patterns/playbook/phase_08_dashboard.md`
- `patterns/playbook/phase_09_narrative.md`
- `patterns/playbook/phase_10_self_assessment.md`

---

## 7. Python Dependencies

```
# Core
pandas
numpy

# Modeling
xgboost
scikit-learn

# Interpretability
shap

# Visualization
plotly
matplotlib
streamlit
streamlit-shap

# Data
duckdb
pyarrow  # parquet I/O
```

Do not use: `scipy`, `tensorflow`/`pytorch`, `imblearn`/SMOTE.

---

*Card Fraud Analytics — Playbook v3.2 (hybrid inline-judgment orchestration)*
*The pattern is the product. Subagents handle mechanical work. The main thread handles judgment and synthesizes.*
