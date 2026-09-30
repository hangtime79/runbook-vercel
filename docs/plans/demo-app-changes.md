# Demo app changes (execution plan for a Sonnet session)

Hand this file to a fresh Claude Code session in the repo root. Execute it top to bottom.

## Context

The app is being used in a sales-style demo (`docs/demo/demo-script.md`) whose job is to make
the Vercel platform visible behind each screen. Several claims in the script need something on
screen to point at. This plan adds those, and nothing else. Research with sources:
`docs/demo/vercel-positioning.md`.

## Rules

- Read `CLAUDE.md`, `SPEC.md`, `docs/demo/demo-script.md` first.
- Vercel system env vars, AI SDK 7 and AI Gateway response metadata postdate model training:
  read vercel.com/docs and `node_modules/ai` types. Never from memory.
- Python: uv only, write then `uv run python3 <file>`. Never `python -c`, never pip.
- Git: explicit paths; never `git add -A` / `.` / `commit -a`. Commit per step. **Do not push.**
- Never `vercel setup`, `vercel env`, `vercel link`, `vercel git connect`, `--prod`.
  `vercel deploy --yes` (preview) is allowed at the end.
- Do not change `lib/askdb.ts` (read-only guard). Keep every SPEC invariant.

## Step 1 — Deployment badge (script beats 3 and 4)

In the sidebar footer (`components/shell/AppShell.tsx`), a small badge:
`preview · a1b2c3d` / `production · a1b2c3d` / `local`, with the commit message as a tooltip and
the SHA linking to the GitHub commit. Source: Vercel's system environment variables for
environment, commit SHA, commit message, repo (find the exact names in the docs; some are only
set for git-triggered deployments, so the badge must degrade to `preview` without a SHA for CLI
deploys). Read them on the server; expose only these values, never the whole env.

## Step 2 — Per-answer model, time and cost (script beats 2 and 5)

On each Ask answer's evidence card footer, add: model id · total time · tokens in/out · cost.
- Model id and timing: from the route (`app/api/ask/route.ts`), sent as message metadata.
- Tokens: the stream's total usage (already produced for eval mode; send it always now, it holds
  no secrets).
- Cost: prefer the cost the AI Gateway reports in its response/provider metadata if the installed
  SDK exposes it (check the types). Otherwise compute input tokens × input price + output tokens ×
  output price, using prices exported at build time from
  `https://ai-gateway.vercel.sh/v1/models` into `data/model_prices.json` by
  `pipeline/export_web_data.py` (allowlisted models only). Label which one it is ("gateway cost"
  vs "list-price estimate").

## Step 3 — Model switch in the Ask panel (script beat 2)

A small select in the Ask panel header with exactly three models: `openai/gpt-6-luna` (default),
`deepseek/deepseek-v4-pro-0813`, `google/gemini-3.8-flash`.
- Server-side allowlist in the route; any other value is ignored and the default is used.
- Enabled only when `ASK_DEMO_MODEL_SWITCH=1`. **Do not set env vars on Vercel** (no `vercel env`):
  document the variable in `.env.example`, `CLAUDE.md` and the report; the owner sets it. With it
  unset, the select is hidden and behaviour is unchanged.
- The existing eval override (`ASK_ALLOW_MODEL_OVERRIDE`) stays as is.

## Step 4 — "How it runs" panel (script beats 1–6, and the fast run)

A compact page `/platform` (add to the sidebar after Ask, number `07`) that is the presenter's
cheat sheet on screen: one card per layer with what this app uses and the one-line Vercel value,
taken **only** from `docs/demo/vercel-positioning.md` wording:
Next.js server components · Vercel Functions on Fluid compute (Active CPU) · DuckDB in the
function (read-only) · AI SDK 7 · AI Gateway (one string, no markup, OIDC, no stored key) ·
Preview deployments + Deployment Protection · Instant Rollback · Vercel Connect + Snowflake
(badge "Next", no claims beyond the positioning doc). Include the live deployment badge values
and the current `ASK_MODEL`. Match the Geist Dark design system already in the app.

## Step 5 — A data-source seam for P3 (no Snowflake yet)

Snowflake via Vercel Connect comes later. Prepare the seam only: the Ask query path and the
DuckDB-backed pages call a small interface (`lib/source.ts`: `query(sql) → {columns, rows}` and
the named page queries) with the DuckDB implementation behind it. No behaviour change, no new
packages, parity must still pass. Note in `SPEC.md` P3 where the Snowflake implementation will
plug in.

## Verification

1. `npm run build` passes; `uv run python3 pipeline/check_parity.py` all PASS;
   `uv run python3 pipeline/check_story_figures.py` PASS.
2. `node pipeline/stress_ask.mjs http://localhost:3000 1` 6/6, write refused.
3. `node pipeline/browser_smoke.mjs http://localhost:3000` passes; extend it to assert the
   evidence footer shows model, time and cost, and that `/platform` renders.
4. Locally with `ASK_DEMO_MODEL_SWITCH=1`: ask the same question on each of the three models;
   the footer shows each model id and a different cost. A non-allowlisted model in the request
   body falls back to the default.
5. `vercel deploy --yes`; `vercel curl` every route incl. `/platform` → 200; one `/api/ask`
   question finishes. Check the badge on the preview shows `preview`.

## Report

Write `docs/handoffs/demo-app-changes-report.md` (≤ 350 words): status, commits, env var names
used for the badge (and which are missing on CLI deploys), cost source (gateway vs estimate),
verification results, preview URL, what the owner must set (`ASK_DEMO_MODEL_SWITCH`, git
connect). Commit it by path. The last line must be exactly:
<!-- END OF REPORT -->
