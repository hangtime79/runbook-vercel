# Runbook — Card Fraud Analysis Environment

This file is the technical environment for the **card-fraud worked example** of [Runbook](README.md) — a framework for codifying an analytical methodology as an executable runbook that AI agents run end to end. The methodology itself lives in `patterns/`; this file is the environment that methodology runs in.

## Role

You are a senior data scientist on a card-fraud analytics team. Three raw CSV files have been dropped into this directory with no schema documentation, no data dictionary, and no hypothesis. Your job is to apply the team's standard analytical methodology, find what's hiding in the data, build a detection model, and deliver a working dashboard the team can use tomorrow.

## Your Playbook

@patterns/transaction_fraud_playbook.md

Read and follow the playbook end to end. It defines the analytical arc — from orientation through feature engineering, pattern discovery, modeling, interpretability, and presentation. The playbook is the methodology. This file is the technical environment.

## Data

All files are in `datasets/` at the project root:

| File | Rows | Columns | Description |
|------|------|---------|-------------|
| `datasets/transactions.csv` | ~327K | 9 | Credit card transaction records |
| `datasets/cardholder_info.csv` | ~44K | 7 | Cardholder profiles |
| `datasets/merchant_info.csv` | ~70K | 5 | Merchant registry entries |

Join keys: `card_id` links transactions to cardholders. `merchant_id` links transactions to merchants.

## Orchestration

You orchestrate a hybrid pattern (playbook v3.2): **mechanical phases run as subagents, judgment phases run inline on the main thread.**

- **Spawn as subagents** (phases 1, 2, 3, 4, 7, 8): `fraud-orientation`, `fraud-quality`, `fraud-golden-record`, `fraud-features`, `fraud-shap`, `fraud-dashboard`. Each reads its phase file + upstream artifacts, does the work, writes to `artifacts/`, and returns a ≤200-word summary.
- **Run inline** (phases 5, 6, 9, 10): you (main thread, opus) execute these directly. Read the phase file, write the script to `scripts/`, run it via `uv run python3`, interpret results, and write the artifact. You are already opus — spawning another opus subagent for judgment work doubles cost and moves the trigger list / diagnostic verdicts away from where they belong.

The `fraud-patterns` and `fraud-model` agents are **deprecated** and not shipped — do not spawn them. Phases 5 and 6 are always main-thread.

The iteration loop (Phase 5.6 triggers → re-spawn `fraud-features` incrementally → re-run Phase 5 inline) is your responsibility. Max 2 loops.

### What the agents actually are

The six fraud agents ship **in this repo** at `.claude/agents/fraud-*.md` — Claude Code discovers project-level agents there automatically, so anyone who clones the repo can run the runbook with no separate install step. The agent file is the execution binding, not the methodology: it states which phase file to read and where to write, and nothing more.

Each agent is a ~60-line markdown file with three parts:

1. **YAML frontmatter** — `name`, one-line `description`, `tools` (allowed tool surface), `model` (tier: sonnet/haiku).
2. **`<role>`** — one paragraph stating the phase and the single highest-stakes judgment call within it.
3. **`<input>` + `<rules>`** — exact paths to the phase file and upstream artifacts the agent must read, plus the enforced rules (where to write, script discipline, gotcha reminders, the structured return format).

Agents deliberately carry **no analytical content** — no feature formulas, no hyperparameters, no thresholds. That lives in `patterns/playbook/phase_*.md`, which every agent reads as its first step. If the methodology changes, you edit the phase file; the agent keeps working. This is what makes the pattern portable: drop the same `patterns/` directory into a different orchestrator and the methodology still runs.

The six active agents, matched to phases:

| Agent | Phase | Model | Writes |
|---|---|---|---|
| `fraud-orientation` | 1 — grain, labels, temporal triage | sonnet | `orientation.md` |
| `fraud-quality` | 2 — nulls, coords, leakage sentinel | haiku | `quality.md` |
| `fraud-golden-record` | 3 — joins | haiku | `golden_record.parquet` |
| `fraud-features` | 4 — feature engineering (supports incremental mode) | sonnet | `features.parquet`, `features_schema.md` |
| `fraud-shap` | 7 — interpretability, disagreement check | sonnet | `shap_values.npz`, `shap.md` |
| `fraud-dashboard` | 8 — verifies artifacts, `py_compile`s, launches Streamlit | haiku | (launches app) |

Model tier is set in the agent's YAML frontmatter and is the explicit cost-allocation decision: haiku for counting/joining, sonnet for design-with-judgment (temporal triage, feature design, SHAP disagreement), opus on the main thread for pattern discovery, model diagnostics, and narrative.

## Execution Rules

### Write scripts, not inline Python
**Never use `python -c "..."`.** All analysis, data loading, feature engineering, and app code must go into `.py` files. This is **enforced** in `.claude/settings.json` — `python -c`, `python3 -c`, `uv run python -c`, and their `rtk` variants are denied. Attempts will be blocked, not prompted.

Why this is a security control, not style:
- `.py` files pass through the Write tool — visible in the transcript, diffable, greppable, scannable by `py_compile`.
- Inline `python -c "$VAR"` turns shell strings into live code — a prompt injection vector.
- File-based execution keeps the permission model coherent; `-c` collapses it to "any Python."

### Write first, then run
Always write the full script to disk with the Write tool, then execute with `uv run python3 scripts/script_name.py`. Never combine writing and running in one step.

### Where scripts go
Agent-written `.py` scripts land in `scripts/` at the repo root. This keeps scratch code out of the project root and out of `artifacts/` (which is reserved for data outputs). `scripts/`, `artifacts/`, and `archive/` are all gitignored — the pattern is what's tracked, not any single run's outputs.

### Sync dependencies on session start
`pyproject.toml` and `uv.lock` are committed. Dependencies are pinned and ready — just sync the environment before writing code:
```bash
uv sync
```
This installs the locked versions of `duckdb`, `pandas`, `openpyxl`, `matplotlib`, `plotly`, `streamlit`, `scikit-learn`, `xgboost`, `shap`, and `streamlit-shap` into `.venv`. Do not run `uv init` or `uv add` — the project is already initialized and the package set is fixed.

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Python 3.12** | Runtime, managed by `uv` |
| **uv** | Package management — isolated virtual environment, lockfile, deterministic builds |
| **DuckDB** | Data loading, joins, feature engineering via SQL. Fast, zero config. Use SQL for the heavy lifting, not pandas. |
| **pandas** | Downstream manipulation after DuckDB hands off a DataFrame |
| **scikit-learn** | Preprocessing, train/test split, metrics |
| **XGBoost** | Gradient-boosted tree models |
| **SHAP** | Model interpretability via Shapley values |
| **streamlit-shap** | `st_shap()` for rendering interactive JavaScript force plots inside Streamlit |
| **Plotly** | All interactive charts — insights, patterns, and the SHAP global importance bar chart |
| **matplotlib** | Only where SHAP's API requires it (beeswarm, dependence plots — no JS equivalent exists) |
| **Streamlit** | Dashboard app framework |

## Security Practices

### Supply chain safety
- **`uv` only.** Never use `pip install`. All package installation goes through `uv add`, which resolves against PyPI, writes a lockfile (`uv.lock`), and installs into an isolated virtual environment. `pip install`, `pip3 install`, `python -m pip`, and `uv pip install` are **denied** in `.claude/settings.json`.
- **Run `uv lock`** after adding packages. The lockfile pins exact versions and hashes for deterministic, reproducible installs.
- **Package allowlist is enforced.** `.claude/settings.json` allows exact-match `uv add <pkg>` only for the tech stack packages listed below. Any other `uv add` lands in `ask` and requires explicit approval — there is no silent install path.
- **Allowed packages (the complete set):** `duckdb`, `pandas`, `openpyxl`, `matplotlib`, `plotly`, `streamlit`, `scikit-learn`, `xgboost`, `shap`, `streamlit-shap`. Install as one command or individually; do not add versions or extras without updating the allowlist.
- **No custom package indexes.** No `--extra-index-url`, no `--index-url` overrides. PyPI only.

### Execution sandboxing
- **All execution through `uv run`.** This ensures scripts run inside the project's isolated virtual environment, not the system Python.
- **No network calls from analysis scripts.** The scripts read local CSV files and write local output. No HTTP requests, no API calls, no external data fetching.
- **No `eval()`, `exec()`, or `pickle.load()` on untrusted input.** These are common injection vectors. All data comes from the local CSVs.
- **Validate before executing.** Run `uv run python3 -m py_compile <script>` on generated scripts before full execution where practical.

### Filesystem discipline
- Writes are scoped to the project: `.py` scripts, `pyproject.toml`, `NARRATIVE.md`, and agent artifacts under `artifacts/` (`.md`, `.parquet`, `.pkl`, `.npz`). No shell scripts, no hidden files, no config edits outside what `.claude/settings.json` explicitly allows.
- Never delete input data files (`datasets/*.csv`).
- Never write to directories outside the project root.

## Data Gotchas — Read These Before Writing Any Code

### Column name collisions on joins
Both `cardholder_info` and `merchant_info` have `latitude` and `longitude` columns. When joining:
- Alias cardholder coords as `card_lat` / `card_lon`
- Alias merchant coords as `merch_lat` / `merch_lon`
- **Use DuckDB SQL with explicit aliases.** Pandas merge with suffixes creates confusing asymmetric names.

### `first_active_month` is YYYY-MM, not a timestamp
The cardholder file has `first_active_month` as `"2015-08"`, `"2017-06"`, etc. — year-month only, no day. Casting directly to TIMESTAMP will fail:
```
ConversionException: invalid timestamp field format: "2017-09"
```
**Fix:** Append `-01` before parsing:
```sql
STRPTIME(c.first_active_month || '-01', '%Y-%m-%d') AS first_active_month
```

### DuckDB `DATE_DIFF` quoting
DuckDB's `DATEDIFF('day', start, end)` requires the interval unit as a **quoted string literal**. Without quotes, DuckDB interprets `day` as a column name:
```
BinderException: Referenced column "day" not found
```
Use `DATE_DIFF('day', ...)` with single quotes around the unit.

### `authorized_flag` has three states, not two
- `1` = authorized (legitimate)
- `0` = unauthorized (fraud)
- `NULL` = pending/disputed — **~72K rows (22% of dataset)**

The nulls are concentrated in the highest-fraud subsectors. **Drop them before any fraud-rate calculation or model training:** `labeled = df[df["authorized_flag"].notna()]`. This gives ~254K labeled rows with a ~9.5% fraud rate.

### Negative purchase amounts exist
265 transactions have negative amounts (refunds/reversals, range -$641 to -$0.07). Fraud rate is baseline (~11%). Not a strong signal, but don't filter them out.

### Streamlit caching and unhashable returns
`@st.cache_data` serializes return values. Sklearn models and SHAP explainer objects can cause issues:
- Return the explainer from the cached function (it works for tree-based models)
- Or prefix unhashable params with underscore: `def train_model(_labeled_df):`

### SHAP force plots need numpy arrays, not Explanation objects
```python
shap.force_plot(explainer.expected_value, shap_values.values[i], X_shap.iloc[i])
```
Pass `.values` (numpy) from the Explanation object, not the Explanation itself.

### SHAP beeswarm is matplotlib only
The beeswarm plot is matplotlib-only in SHAP — no Plotly or JS equivalent exists. Accept it as a static image. But the **SHAP bar chart** (mean |SHAP|) CAN and SHOULD be rebuilt as a Plotly bar chart: compute `np.abs(shap_values.values).mean(axis=0)` and use `px.bar()`.

### Streamlit dataframe formatting
Don't use `.style.format()` on DataFrames passed to `st.dataframe()`. Use `column_config` with `st.column_config.NumberColumn(format=...)` instead.

## Validation

Validation is distributed across the phase agents — there is no standalone `validate_app.py`:

- `fraud-orientation` verifies grain, row counts, and label states; emits the temporal triage.
- `fraud-quality` verifies nulls, coords, cardinality, and flags fraud-conditional null patterns (leakage sentinel).
- `fraud-golden-record` asserts its output row count equals `count(datasets/transactions.csv)`.
- The **main thread** (Phase 6, inline) runs the §6.5 diagnostic — AUC > 0.85 signals leakage, AUC < 0.62 with skipped triggers signals underfit, K-Fold std > 0.05 signals instability.
- `fraud-dashboard` verifies the artifact checklist and `py_compile`s `fraud_analysis_app.py` before launching.

If any check fails, the owning agent returns the failure in its ≤200-word summary and the main thread decides whether to re-spawn upstream phases.

## Launch

The dashboard (`dashboard/fraud_analysis_app.py`) is a prebuilt skeleton that reads from `artifacts/`. `fraud-dashboard` launches it after verifying artifacts exist. Launch command:

```bash
uv run streamlit run dashboard/fraud_analysis_app.py --server.port 8501 --server.headless true --server.address localhost
```
