# Runbook on Vercel — spec

**Status:** P1 built from this spec; P2 built and verified locally (`docs/ask-eval.md`), preview deploy pending; P3 not started. Historical note: the dashboard originally ran on Streamlit (a long-running Python server that cannot deploy to Vercel), which is why the app was rebuilt in Next.js.
**What it is:** the Runbook fraud dashboard, rebuilt on Vercel's stack as a showcase of building
with Vercel: Next.js, the AI SDK, AI Gateway, and Vercel Connect. P1 and P2 are needed on a live
URL within about a week; P3 within a few weeks.

## The story it has to tell

1. **"I rebuilt it on your stack."** The fraud dashboard used to run on Streamlit. Streamlit is a
   long-running Python server over websockets and cannot be deployed to Vercel as-is. The same five
   views, rebuilt in Next.js, deployed on Vercel.
2. **"A non-developer can ask the data a question."** The existing Q&A answers from the written
   analysis. The rebuild adds text-to-SQL over the live data, through the AI SDK and AI Gateway.
3. **Step 2, the punchline: "the platform owns the credential."** Swap DuckDB for Snowflake through
   Vercel Connect. Same app, no long-lived secret in the environment: anyone building an app
   against Snowflake has to understand OAuth, someone vibe-coding one will not, so the platform
   has to own it.

## Phases

| Phase | Delivers | Done when |
|---|---|---|
| **P1 · Live on Vercel** | Next.js app in the repo root, the five views (Narrative, Key Findings, Fraud Patterns, Detection Model, Data Explorer), reading the committed `data/` exports through DuckDB | A public Vercel URL renders every view with the same numbers as `pipeline/parity_reference.json` (headline counts, chart aggregates, SHAP importances) |
| **P2 · Ask the data** | "Ask the analysis" on the AI SDK through AI Gateway, plus a text-to-SQL tool that runs read-only against DuckDB and shows the SQL it ran | Five scripted demo questions return correct answers with the SQL visible; a write attempt is refused |
| **P3 · Snowflake via Connect** | The same data loaded into a Snowflake trial; the app reads it through Vercel Connect's Snowflake connector | The DuckDB path and the Snowflake path return identical results on the five demo questions, and no Snowflake secret sits in the Vercel environment |

**P1 + P2 first, on a live URL. P3 after.**

**Where P3 plugs in.** `lib/source.ts` defines the `DataSource` interface (a guarded `query(sql)` plus the named page queries); today `lib/duckdbSource.ts` and `lib/askdb.ts` implement it. The Snowflake version is a second implementation (`lib/snowflakeSource.ts`) that gets its token from `getToken(...)` in `@vercel/connect` and is chosen by one env var. Pages and the Ask tool do not change. `pipeline/test_guard.mts` and `pipeline/check_parity.py` are the acceptance tests for the new implementation.

## Architecture

| Layer | Original Streamlit build | On Vercel |
|---|---|---|
| UI | Streamlit tabs | Next.js App Router, one route per view |
| Data | pandas over `artifacts/*.parquet` | DuckDB over the same parquet (P1–P2), Snowflake via Connect (P3) |
| Model and SHAP | `model.pkl`, `shap_values.npz` loaded at runtime | **Precomputed to JSON at build time** by a small Python export script. No Python at runtime |
| Q&A | Anthropic SDK, whole analysis stuffed in the system prompt | AI SDK via AI Gateway; the analysis docs as context, plus a `query` tool for SQL |
| Charts | Plotly | A React charting library, chosen in P1 |

## Invariants — breaking these is a defect

1. **The artifacts are the contract.** The web app reads `data/`, exported by `pipeline/export_web_data.py` from `artifacts/` and `NARRATIVE.md`. It never
   trains, joins or recomputes the analysis. The original Streamlit app kept the same rule.
2. **SQL is read-only.** The query tool rejects anything but a single `SELECT`, and the connection
   is opened read-only as well. Two layers, because a prompt is not a permission.
3. **No secret reaches the client.** Model keys and data credentials live server-side only.
4. **Every AI answer shows its SQL.** A non-developer can trust an answer they can inspect.
5. **The app's model calls go through AI Gateway; the coding agent's do not.** Every AI SDK call in
   the app uses the gateway. Claude Code, the tool building this, stays on its direct Anthropic
   login: never add `ANTHROPIC_BASE_URL` or gateway keys to `~/.claude/settings.json`, and never
   run `vercel setup` / `vercel ai-gateway setup`, which rewrites that file. Locally the app reads
   `AI_GATEWAY_API_KEY` (exported from the shell profile, or `.env.local`, which must stay
   gitignored). On Vercel, check the docs for whether the deployment authenticates to the gateway
   through its OIDC token, so no key is stored in project env vars.
6. **Numbers match the parity reference.** `pipeline/parity_reference.json` holds the numbers the original Streamlit app produced. Any divergence is a bug in the port, not a rounding choice.

## Verify before building — each of these is an assumption

Resolved by the spike and the P1 build: native DuckDB runs in a Vercel Node function (with `libduckdb.so` added through `outputFileTracingIncludes`), and the data ships as a committed `data/` folder written by an export script. Dataset licence resolved (public Kaggle set). Still open: Connect and AI Gateway specifics.

- ⚠️ **DuckDB inside a Vercel Node function.** The native `@duckdb/node-api` binary has to fit and
  load in the function runtime. If it does not, fall back to DuckDB-WASM in the browser, or to
  precomputed JSON for P1. Spike this first.
- ⚠️ **Data location — and `artifacts/` is gitignored.** ~23MB of parquet (`golden_record` 12MB,
  `features` 11MB) plus `model.pkl` and `shap_values.npz`, all regenerated per run and **not in
  git**. A git-triggered Vercel build will not see them. Options: an export step that writes the
  web app's inputs (parquet subset + JSON) into `data/` and commits those, a CLI deploy that uploads
  local files, or Vercel Blob. Decision: committed `data/`. Also check whether `vercel deploy` honours
  `.gitignore`.
- ✅ **The dataset's licence.** Resolved: a public Kaggle dataset, fine to serve on a public URL.
- ⚠️ **Vercel Connect's Snowflake connector** — read the docs cold before P3. Nothing about Connect
  should be written from memory; it launched after the model cutoff.
- ⚠️ **AI Gateway model ids and the AI SDK version** — take them from the installed package docs,
  not memory.

## Prerequisites (owner)

- A Vercel account and the Vercel CLI logged in.
- An AI Gateway key.
- P3 only: a Snowflake trial account.

## Out of scope

- Retraining or changing the model.
- Authentication for viewers. The URL is a demo with public data.
- Porting the agent runbook itself onto eve. That is `/opt/github/role-triage-agent`'s job.
