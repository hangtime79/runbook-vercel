# P2 — Ask the data (execution plan)

Hand this file to a fresh Claude Code session in the repo root. Execute it top to bottom.

## Context

P1 is done: the Next.js app at the repo root serves five views from `data/` through DuckDB, and
a preview deploy matches the old Streamlit numbers exactly (`pipeline/check_parity.py`). P2 adds
**"Ask the data"**: a non-developer types a question, the app turns it into SQL, runs it
read-only against the fraud data, and answers, **showing the SQL it ran**. Model calls go through
**Vercel AI Gateway** using the **AI SDK**. See `SPEC.md` (P2 row, invariants 2–5).

Decisions already made (do not relitigate):
- **Placement:** on the Narrative page (`/`), replacing the "Ask the analysis — coming in P2"
  placeholder. The narrative text stays below it.
- **Model is one setting.** Env var `ASK_MODEL`, default `google/gemini-3.8-flash`. Candidates
  to compare: `google/gemini-3.8-flash`, `deepseek/deepseek-v4-pro-0813`, `openai/gpt-6-luna`.
  Prompts and data are not sensitive; data-retention policy is not a selection criterion.
- **Ends on a preview deploy.** No `--prod`.

## Rules

- Read `CLAUDE.md` and `SPEC.md` first.
- **AI SDK, AI Gateway and Vercel APIs postdate the model's training.** Read the installed
  packages' docs/types in `node_modules` and vercel.com docs (Vercel MCP
  `search_vercel_documentation` if available). Never write these APIs from memory. Install the
  current AI SDK packages with `npm install` and record the versions in the final report.
- Python: uv only, write the file then `uv run python3 <file>`. Never `python -c`, never pip.
- Git: stage explicit paths; never `git add -A` / `git add .` / `git commit -a`; never `git push`.
  Commit after each step. End commit messages with the Co-Authored-By line from your system
  attribution.
- Never run `vercel setup` or `vercel ai-gateway setup`, and never touch `~/.claude/settings.json`
  or `.claude/settings.json`. Claude Code itself stays off the gateway.
- **Ask the owner before:** any `vercel env` change, any `--prod` deploy.
- `.env.local` (holds `VERCEL_OIDC_TOKEN` from `vercel link`) is gitignored and must stay so.
  `AI_GATEWAY_API_KEY` may also be present in the shell environment. Never print either value.

## Step 1 — Gateway auth and a smoke test

1. From the docs, determine how the AI SDK authenticates to AI Gateway (a) locally and (b) on a
   Vercel deployment. Expectation to verify: OIDC (`VERCEL_OIDC_TOKEN`) on Vercel with no stored
   key, and either the OIDC token in `.env.local` or `AI_GATEWAY_API_KEY` locally.
2. `npm install` the AI SDK core, its React hooks package, and whatever gateway provider the docs
   specify.
3. Add `app/api/ask/route.ts` with the smallest possible call: one fixed prompt to `ASK_MODEL`,
   return the text. Confirm it works on `npm run dev`. Then remove the fixed prompt in Step 3.

## Step 2 — A read-only database for queries

Two independent layers, because a prompt is not a permission (SPEC invariant 2):

1. **Read-only by construction.** Extend `pipeline/export_web_data.py` to also build
   `data/fraud.duckdb` with tables `golden_record` and `features` loaded from the parquet
   artifacts. Open it in the app with DuckDB `access_mode = 'READ_ONLY'`, then set
   `enable_external_access = false` and `lock_configuration = true` so a query cannot read other
   files or change settings. Verify the Python-written file opens under `@duckdb/node-api`
   (storage-format compatibility); if not, pin the Python `duckdb` version to match.
2. **Statement check.** Before running, confirm the SQL is exactly one `SELECT` (or `WITH …
   SELECT`) statement. Prefer DuckDB's own parser (e.g. `json_serialize_sql`, which only accepts
   SELECT) over regex; reject on any parse error or multiple statements.
3. Wrap every query as `SELECT * FROM (<sql>) LIMIT 200` and set a short query timeout.
4. Add the `fraud.duckdb` path to `outputFileTracingIncludes` for `/api/ask` in
   `next.config.ts`, alongside `libduckdb.so`. Decide whether P1 routes should also switch to
   the `.duckdb` file (smaller deploy, one source) — do it only if parity still passes.

## Step 3 — The ask route and the `query` tool

- `app/api/ask/route.ts`: stream a response from `ASK_MODEL` via the gateway, with one tool,
  `query(sql)`, that runs through Step 2's guard and returns `{ sql, columns, rows, rowCount }`
  or `{ sql, error }`. Allow a few tool steps so the model can fix a failing query.
- System prompt context (server-side only): table schemas (column names + types + meaning, from
  `data/docs/features_schema.md` and `orientation.md`), the fraud definition
  (`authorized_flag = 0` is fraud; `NULL` rows are unlabeled and excluded from rates), and the
  analysis docs (`NARRATIVE.md`, `findings.md`, `metrics.md`, `shap.md`). Extend the export to
  copy `features_schema.md`, `orientation.md` and `quality.md` into `data/docs/`. Instruct: answer
  from query results, cite numbers, say so when the data can't answer.
- `ASK_MODEL` model override from the request body is accepted **only** when
  `ASK_ALLOW_MODEL_OVERRIDE=1` (local eval), never in the deployed app.
- No key or token ever reaches the client.

## Step 4 — UI on the Narrative page

A client component above the narrative: question box, streamed answer, and for every tool call a
collapsible block with the **SQL** (monospace) and the result table (first rows). Errors and
refusals render plainly. Use the AI SDK's React hook per its current docs.

## Step 5 — Demo questions, oracle, and model comparison

1. Write five demo questions a fraud investigator would ask, each answerable from the data with
   one or two queries. Mix: a rate by bucket, a top-N ranking, a comparison of two groups, a
   time-of-day question, and a merchant-concentration question. Plus one **write attempt**
   ("Delete all the fraud rows").
2. `pipeline/ask_oracle.py` (tracked): compute each expected answer with pandas from the parquet
   files → `pipeline/ask_expected.json`.
3. An eval script (Node or Python, tracked) that sends each question to the local `/api/ask` for
   each candidate model (via the override), and records: correct vs oracle (numbers within
   rounding), the SQL, latency, and token usage. Cost per question = input tokens × input price
   + output tokens × output price, prices from `https://ai-gateway.vercel.sh/v1/models`.
   Write the results to `docs/ask-eval.md` as a table, one row per model × question, with a
   per-model summary (correct count, median latency, total cost). The write attempt must be
   refused by the guard for every model.
4. Keep `ASK_MODEL` default at `google/gemini-3.8-flash` unless the eval shows it fails questions
   another candidate passes; report the recommendation, do not change the default silently.

## Step 6 — Docs and preview deploy

1. Update `SPEC.md` (P2 status), `CLAUDE.md` (the ask route, the read-only guard, `ASK_MODEL`,
   gateway auth), `README.md` (how to run Ask locally), `.env.example` (`ASK_MODEL`, auth note —
   no values).
2. `npm run build`, run `pipeline/check_parity.py` again against localhost (P1 must not regress).
3. `vercel deploy --yes` (preview). If the deployment needs any env var set, **stop and ask the
   owner** with the exact command. Test with `vercel curl`: `/api/stats`, and each demo question
   through `/api/ask`, plus the write attempt.

## Done when

- All five demo questions return correct answers with the SQL visible, on localhost and preview.
- The write attempt is refused on both.
- `docs/ask-eval.md` compares the three models.
- P1 parity still passes; `npm run build` passes.

## Final report (≤300 words)

Commits (hash + subject); AI SDK package versions; gateway auth method used locally and on
Vercel; the guard design; eval summary per model and the recommended default; preview URL;
deviations from this plan; anything needing the owner.
