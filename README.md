# Runbook

**Codify the method. Let agents run it.**

Runbook is a framework for turning a data-analysis methodology into a portable, human-readable **runbook** that AI agents execute end to end — orientation, data quality, feature engineering, pattern discovery, modeling, interpretability, and a shipped dashboard. The worked example in this repository is card-transaction fraud detection, but the pattern is domain-agnostic. The durable asset is the *method*, not any single run's output.

> A capable analyst could execute this runbook with a week and a whiteboard. When AI agents execute it instead, the methodology stays the asset and the tooling does the work. That separation is the whole idea.

This repo is a complete, runnable example: clone it, point an agent runtime at it, and it reproduces an end-to-end fraud analysis — model, dashboard, and an analytical brief — from three raw CSVs. Then it shows you how to build your own runbook for your own domain.

---

## 1. Why codify your methodology?

Most analytical work lives in one of two places: a senior analyst's head, or a pile of one-off notebooks. Both are fragile. The analyst leaves; the notebook rots; the next analysis reinvents its approach from scratch. A **codified methodology** changes the unit of value from the individual run to the repeatable process.

| Without a codified methodology | With a runbook |
|---|---|
| Each new analysis reinvents its approach | The runbook *is* the approach — one set of files, reviewable by anyone |
| Tribal knowledge stays in one person's head | Anyone executes the same quality bar — senior analyst, new hire, or agent |
| Onboarding is months of shadowing | Onboarding is reading a methodology document |
| Quality is unauditable and trust-based | Quality is auditable — read the runbook, spot-check the run |
| Compute cost is opaque and uniform | Cost is allocated explicitly — cheap models on mechanical work, strong models on judgment |
| Reproducing last quarter's analysis is archaeology | Every phase writes a known-format artifact; any phase re-runs against the last one's output |

The payoff is not "AI does your analysis." It is that your *method* — the steps, the checks, the judgment calls — becomes an asset your organization owns, versions, and improves, independent of who (or what) executes it on any given day.

---

## 2. What a "runbook" actually is

Everywhere else in a serious organization — operations, compliance, finance, on-call engineering — real work runs against an **operating manual**. A document a new hire reads, a reviewer spot-checks, an auditor references. It doesn't script every keystroke. It establishes the steps, the checks, the handoffs, and the judgment calls, then trusts the practitioner for the last ten percent — the intuition.

A runbook is that operating manual for an analysis. In this repo:

- `patterns/transaction_fraud_playbook.md` — the orchestration router (what runs in what order, at what quality tier)
- `patterns/playbook/phase_01..10.md` — the methodology per phase (orientation, data quality, golden record, features, pattern discovery, modeling, interpretability, dashboard, narrative, self-assessment)

Plain markdown. A capable analyst can read both end to end and tell you whether the analytical arc is correct — without ever running a line of code. That is the test of a good operating manual. The methodology is legible on its own; the execution engine is interchangeable.

---

## 3. How it works

The runbook is split into a **methodology layer** (portable markdown) and an **execution layer** (the agent runtime that reads it). This implementation runs on [Claude Code](https://www.anthropic.com/claude-code) as the execution layer, but nothing about the methodology is specific to it — any orchestrator that can read markdown and spawn subprocesses could run the same pattern.

Four ideas do the heavy lifting:

- **Thin agents, fat methodology.** Six small agent definitions (`.claude/agents/fraud-*.md`, ~60 lines each) carry *no* analytical content — no feature formulas, no thresholds, no hyperparameters. They state which phase file to read and where to write. All the analytical substance lives in `patterns/playbook/phase_*.md`. Change the methodology and the phase file changes; the agent keeps working. This is what makes the pattern portable.
- **Tier routing as cost discipline.** Which model runs which phase is a line in a file, not a runtime guess. Cheap models handle mechanical work (data-quality counting, joins, launching the dashboard). Strong models handle judgment (the temporal-leakage triage, feature design, model diagnostics, the narrative). You never pay top-tier rates to join two tables.
- **Context isolation as correctness discipline.** Each mechanical phase runs as a subagent that absorbs its own script iteration and debug chatter and returns a ≤200-word structured summary. The orchestrator sees the summaries, not the noise. That is how a ten-phase analysis runs without the main context collapsing under its own weight.
- **Artifacts are the contract, not chat.** Every phase writes a file in a known format (`parquet`, `pickle`, `npz`, `markdown`) under `artifacts/`. Re-run interpretability against an existing model without re-running the joins. Swap in last month's data to test a new feature. State is on disk, auditable and reproducible — not trapped in a conversation.

The orchestrator spawns subagents for the mechanical phases, runs the judgment phases itself, handles a bounded iteration loop when a finding warrants a new feature, and synthesizes the final narrative. The full control flow is in [`patterns/transaction_fraud_playbook.md`](patterns/transaction_fraud_playbook.md).

---

## 4. The worked example: card fraud

The included run analyzes ~327K credit-card transactions (three raw CSVs, no schema docs, no hypothesis) and produces:

- A detection model (XGBoost, **AUC 0.76** on holdout) with the temporal-leakage triage done correctly — no post-determination columns leak into the features.
- Seven quantified findings, including a 46-merchant fraud cluster holding 11% of all fraud, a 48%-fraud micro-transaction band that is a textbook card-testing signature, and a signature-capture control worth a 2.3× protection factor.
- An interactive Streamlit dashboard for investigators and an analytical brief for the data scientist walking into a meeting.

The brief is committed as [`NARRATIVE.md`](NARRATIVE.md) — read it to see the *output* a runbook produces. It is generated by the run, not hand-written, and serves as the proof of what the methodology yields.

---

## 5. Getting started

### Prerequisites

- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** — the execution runtime this implementation uses.
- **[uv](https://docs.astral.sh/uv/)** — Python package and environment manager.
- **Python 3.12+** — `uv` will fetch a suitable interpreter if you don't have one.

### Run the example

```bash
# 1. Clone
git clone <your-fork-url> runbook && cd runbook

# 2. Install pinned dependencies into an isolated venv
uv sync

# 3. (Optional) enable the dashboard's Q&A tab — see below
cp .env.example .env   # then paste your Anthropic API key into .env

# 4. Run the full runbook from inside Claude Code
/fraud

# 5. When the run finishes, the dashboard is live at:
#    http://localhost:8501
```

The six subagents ship in `.claude/agents/` and are discovered automatically when you open the project in Claude Code — there is nothing to install separately. The `/fraud` command orchestrates all ten phases (you can also run `/fraud stop-after-4` or `/fraud resume`).

To launch the dashboard on its own against existing artifacts:

```bash
uv run streamlit run dashboard/fraud_analysis_app.py --server.port 8501 --server.headless true --server.address localhost
```

### Optional: enable the dashboard Q&A with your own Anthropic key

The dashboard's first tab, **"Ask the analysis,"** lets you ask natural-language questions about the completed run ("What drives fraud at night?", "Why is the AUC 0.76?") and answers them from the run's own artifacts. This single feature calls the Anthropic API, so it needs **your own key** — everything else in the dashboard works without one.

1. Get a key from the [Anthropic Console](https://console.anthropic.com/).
2. Copy the template and paste your key:
   ```bash
   cp .env.example .env
   # edit .env → ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the dashboard. The Q&A tab activates automatically.

`.env` is gitignored, so your key stays local and is never committed. Without a key, the Q&A tab simply shows a notice and the other four tabs (Key Findings, Fraud Patterns, Detection Model, Data Explorer) work exactly as before. The API usage is whatever you ask of it — a handful of cached calls per session — and billed to your own account.

---

## 6. Build your own pattern

The fraud example is a template, not the point. To adapt the runbook to your own domain:

1. **Drop your data in `datasets/`.** Three CSVs here; yours can be any shape. Update the data section in `CLAUDE.md` so the orientation phase knows what it's looking at.
2. **Rewrite the phase files** in `patterns/playbook/`. The *arc* tends to generalize — orient, check quality, build a clean joined record, engineer features, discover patterns, model, interpret, present — but the specifics are yours. The single highest-stakes phase to get right is orientation's temporal triage: decide which columns existed *at decision time* versus which were filled in after the outcome was known. That call is what separates a real model from one that leaks the answer.
3. **Set your triggers and diagnostics.** The router defines the iteration loop (a finding fires a trigger → engineer a feature → re-verify) and the model diagnostics (what AUC range signals leakage vs. underfit for *your* problem). Tune these to your domain's reality.
4. **Point the agents at your phase files.** The agent definitions in `.claude/agents/` are thin bindings — update the phase paths and artifact names, leave the analytical content in the phase files. Re-tier the models if your mechanical/judgment split differs.
5. **Keep artifacts as the contract.** As long as each phase reads and writes known-format files, you can re-run, swap, and audit any stage independently.

If you do this well, you end up with something another team could clone and apply to *their* data — which is exactly what this repo is.

---

## 7. Repo shape

```
runbook/
├── patterns/                          ← THE METHODOLOGY (portable, human-readable)
│   ├── transaction_fraud_playbook.md      orchestration router
│   └── playbook/
│       ├── phase_01_orientation.md
│       ├── ... (10 phase files)
│       └── phase_10_self_assessment.md
│
├── .claude/
│   ├── agents/fraud-*.md              ← THE EXECUTION BINDING (six thin agents, in-repo)
│   ├── commands/fraud.md                  the /fraud orchestration command
│   └── settings.json                      sandbox + permission allowlist
│
├── CLAUDE.md                          ← THE ENVIRONMENT (security, gotchas, tech stack)
├── dashboard/fraud_analysis_app.py    ← THE VIEW (reads artifacts/ only)
├── pyproject.toml + uv.lock           ← PINNED DEPENDENCIES (deterministic builds)
├── datasets/                          ← SAMPLE DATA (the worked-example inputs)
├── NARRATIVE.md                       ← EXAMPLE OUTPUT (the brief a run produces)
│
├── artifacts/                         ← PER-RUN OUTPUT (gitignored, regenerated each run)
└── scripts/                           ← AGENT SCRATCH (gitignored)
```

Three categories:

- **Methodology + environment — tracked forever.** The runbook, the thin agents, the environment config, the dashboard skeleton, the pinned dependencies. This is what another team clones.
- **Sample data + example output — tracked as the worked example.** `datasets/` holds anonymized inputs (hashed IDs, no names or card numbers) so the repo runs out of the box; `NARRATIVE.md` is a committed example of what a run yields.
- **Per-run output — gitignored, regenerated.** `artifacts/` and `scripts/` are produced by a run and never tracked. The pattern is the product; no single run's output is.

---

## License

MIT — see [LICENSE](LICENSE). Use it, fork it, build your own runbook on it.
