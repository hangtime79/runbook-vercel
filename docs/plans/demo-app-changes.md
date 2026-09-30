# Demo app changes (execution plan for a Sonnet session)

Hand this file to a fresh Claude Code session in the repo root. Execute it top to bottom.

## Context

The app is the prop in a customer demo for an Australian APRA-regulated card issuer, with the
CIO and the Head of Fraud in the room (`docs/demo/demo-script.md`). The story: investigators build
their own apps; the CIO wants common infrastructure, easy development and oversight; both worry
about AI in development and in usage. This plan adds what the script points at on screen, and
nothing else. Sources for every Vercel claim: `docs/demo/vercel-positioning.md`,
`docs/demo/governance-research.md`. **UI copy may only use claims from those two files.**

## Rules

- Read `CLAUDE.md`, `SPEC.md`, `docs/demo/demo-script.md`, `docs/demo/governance-research.md`.
- Vercel system env vars, `vercel.json` options, AI SDK 7 provider options and AI Gateway
  behaviour postdate model training: read vercel.com/docs and `node_modules` types. Never memory.
- Python: uv only, write then `uv run python3 <file>`. Never `python -c`, never pip.
- Git: explicit paths; never `git add -A` / `.` / `commit -a`. Commit per step. **Do not push.**
- Never `vercel setup`, `vercel env`, `vercel link`, `vercel git connect`, `--prod`, and never
  change team or AI Gateway settings (allowlists, rules, budgets). Those are the owner's.
  `vercel deploy --yes` (preview) is allowed at the end.
- Do not weaken `lib/askdb.ts` (read-only guard). Keep every SPEC invariant.

## Step 1 — Run functions in Sydney

Pin all functions to `syd1` in `vercel.json` (check the current schema in the docs). After the
preview deploy, confirm the region from the deployment (`vercel inspect` or response headers,
whichever the docs describe) and record it in the report.

## Step 2 — Zero data retention on every model call

Set per-request ZDR for every AI Gateway call in `app/api/ask/route.ts` using the documented
provider option. The docs say a request **fails** if no ZDR-capable provider serves the model:
check `openai/gpt-6-luna`, `deepseek/deepseek-v4-pro-0813`, `google/gemini-3.8-flash` against the
gateway's ZDR documentation/model catalogue, and by a live call each. Drop any model that
can't serve ZDR from the allowlist in Step 4 and say so in the report. Also set the documented
no-training option if it is per-request.

## Step 3 — Deployment badge

Sidebar footer: `preview · a1b2c3d` / `production · a1b2c3d` / `local`, commit message as
tooltip, SHA linked to the GitHub commit, and the function region. Source: Vercel system env
vars (exact names from the docs; some exist only on git-triggered deploys, so degrade to
`preview` with no SHA for CLI deploys). Read on the server; expose only these values.

## Step 4 — Per-answer model, time, cost + an allowlisted model switch

- Evidence card footer: model id · total time · tokens in/out · cost. Cost: use the gateway's
  reported cost if the SDK exposes it; otherwise a list-price estimate from
  `data/model_prices.json` exported by `pipeline/export_web_data.py` from
  `https://ai-gateway.vercel.sh/v1/models` (allowlisted models only). Label which it is.
- Model select in the Ask panel header: the ZDR-capable models from Step 2, default
  `openai/gpt-6-luna`. Server-side allowlist; any other value falls back to the default. Shown
  only when `ASK_DEMO_MODEL_SWITCH=1` (document it; the owner sets it on Vercel).
- Keep `ASK_ALLOW_MODEL_OVERRIDE` (eval) as is.

## Step 5 — `/governance`: the CIO's view of this app

A page in the sidebar (number `07`, label "Governance") in the Geist Dark system. It is an
**inventory card for this one app**, built from real values where the app can know them:
- Deployment: environment, commit, region (Step 3).
- Access: "Protected by Vercel Deployment Protection" (static; the app can't read the setting;
  label it as configured, not detected).
- Data: sources and access mode (DuckDB file, opened read-only; single-SELECT guard; 200-row cap;
  10 s timeout), from constants in `lib/askdb.ts` (export them; don't duplicate numbers).
- AI usage: allowed models (the allowlist), default model, ZDR on, credential "OIDC, no stored
  key" (static, per SPEC invariant 5), what the AI can do ("reads, shows SQL, cannot write").
- Change control: the checks that gate a change (Step 6), linked to the workflow file.
- APRA mapping table from the demo script's "APRA mapping" section, with a note "quotes to be
  verified against APRA PDFs". Plus the "gaps" rows that concern this app (inference region,
  Enterprise-only controls), stated plainly.

## Step 6 — Change-control checks in CI

`.github/workflows/checks.yml` on pull requests and pushes to `main`:
1. `npm ci` and `npm run build`.
2. `uv sync` then `uv run python3 pipeline/check_story_figures.py`.
3. Parity: start `npm run start` in the background, wait for it, run
   `uv run python3 pipeline/check_parity.py`.
4. The read-only guard: add `pipeline/test_guard.mts` (or extend an existing test) that calls
   `runReadOnlyQuery` with a DELETE, a multi-statement string, an `ATTACH`, a `COPY … TO`, and a
   valid SELECT; assert the four are rejected and the SELECT runs. Run it in CI.
5. `node --no-warnings pipeline/test_ask_headline.mts` (mock model; no network).
No step may call the AI Gateway or need secrets. Pin action versions. Name each job clearly, so
the PR check list reads like the script ("Numbers match source data", "Copy figures trace to
data", "Read-only guard rejects writes", "Build"). Document in `CLAUDE.md` and the report the
owner steps: branch protection on `main` requiring these checks + 1 review, and Vercel
Deployment Checks for production.

## Step 7 — Data-source seam for P3 (no Snowflake yet)

`lib/source.ts`: an interface (`query(sql) → {columns, rows}` plus the named page queries) with
the DuckDB implementation behind it; pages and the Ask tool use it. No behaviour change, no new
packages; parity must still pass. Note in `SPEC.md` P3 where the Snowflake implementation plugs in.

## Verification

1. `npm run build`; parity all PASS; `check_story_figures.py` PASS; `test_guard.mts` PASS;
   `test_ask_headline.mts` PASS.
2. `node pipeline/stress_ask.mjs http://localhost:3000 1` → 6/6, write refused (with ZDR on).
3. `node pipeline/browser_smoke.mjs http://localhost:3000` passes; extend it to assert the
   evidence footer shows model, time and cost, and that `/governance` renders.
4. Locally with `ASK_DEMO_MODEL_SWITCH=1`: same question on each allowlisted model; footer shows
   each model id; a non-allowlisted model in the body falls back to the default.
5. Run the workflow locally as far as possible (the same commands in order) and record results.
6. `vercel deploy --yes`; `vercel curl` every route incl. `/governance` → 200; one `/api/ask`
   question finishes; record the function region the deployment reports.

## Report

`docs/handoffs/demo-app-changes-report.md` (≤ 400 words): status, commits, region confirmed,
ZDR result per model (kept/dropped), env var names used for the badge, cost source, CI jobs and
local results, verification results, preview URL, and the owner's to-do list (git connect,
branch protection, Deployment Checks, `ASK_DEMO_MODEL_SWITCH`, gateway allowlist/rules/budget,
production deploy). Commit it by path. The last line must be exactly:
<!-- END OF REPORT -->
