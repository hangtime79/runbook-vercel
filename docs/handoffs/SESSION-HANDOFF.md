# Session handoff — Runbook on Vercel (2026-09-30)

For the next planning conversation. Read this first, then `CLAUDE.md` and `SPEC.md`. The owner
has changes to make to the tool; nothing below is in progress.

## What this is

A fraud-analytics dashboard (originally Streamlit) rebuilt as a Next.js app on Vercel, used as the
prop in an **interview pitch played as a customer meeting**: an Australian bank's **CIO** and
**Head of Fraud**, both worried about APRA and about AI in development and in usage. Thesis:
*"The CIO owns the platform. The fraud team owns the problem. Both are responsible for the apps."*
Script: `docs/demo/demo-script.md`. Sources for every Vercel/APRA claim:
`docs/demo/vercel-positioning.md`, `docs/demo/governance-research.md`. Don't add claims that
aren't in those files.

## Where things stand

| Thing | State |
|---|---|
| Production | **https://runbook-vercel.aicriticalityindex.com** (Cloudflare CNAME, DNS only) → `fdfb11f`. Also `runbook-vercel.vercel.app` |
| GitHub | `hangtime79/runbook-vercel` (**public**), `main` = `fdfb11f`, in sync with production |
| CI | `.github/workflows/checks.yml`, 6 jobs, all green: Build · Numbers match source data · Copy figures trace to data · Read-only guard rejects writes · Ask tool loop (mock model) · Scope gate blocks off-topic questions |
| Vercel project | `hangtime79/runbook-vercel`, **Hobby plan** (owner won't pay for Pro). Git connected: every push/PR builds a preview |
| Protection | Vercel Authentication, scope **All Deployments** (subdomain requires Vercel login). A legacy automation-bypass secret exists; owner may revoke it |
| Region | Functions pinned to `syd1` (verified via `x-vercel-id`). Builds run in `iad1` |
| Act 3 prop | **PR #1** `demo/act3-overnight-annotation` (open, do not merge), 7 checks green, protected preview `runbook-vercel-git-demo-act3-overnight-annotation-hangtime79.vercel.app` |
| Env vars (Vercel) | `ASK_ZDR=0` (preview + production; Hobby can't use ZDR), `ASK_DEMO_MODEL_SWITCH=1` (**preview only**), `NEXT_PUBLIC_DEMO_PR_URL` (preview) |

## The app, in one screen

- Routes: `/` → `/intro` (full-screen 6-section deck, arrow keys) · `/story` · `/findings` ·
  `/patterns` · `/model` · `/explorer` · `/ask` (+ side panel) · `/governance` · `/brief`.
- Data: `data/` (committed) exported from runbook artifacts by `pipeline/export_web_data.py`
  (uv). DuckDB in the function; `lib/source.ts` is the seam for Snowflake (P3).
- Ask: `app/api/ask/route.ts`. Default model `openai/gpt-6-luna` via AI Gateway (OIDC, no key).
  Read-only guard `lib/askdb.ts` (READ_ONLY file + single-SELECT parse, 200 rows, 10 s).
  **Guardrail stack** `lib/guardrails/` (AI SDK middleware, order from `config.json`):
  `scopeGate` (Jev, `typesafe-ai/jev`, before the answering model; conversation-aware, follow-ups
  to blocked turns inherit the block, three outcomes allow/unclear/block, fails closed) and
  `outputCheck` (Jev on the answer). Cost ≈ $0.00006/question, ≈ 1 s.
- Copy: `lib/introCopy.ts` (intro), `lib/copy.ts` (story/ask; numbers checked by
  `pipeline/check_story_figures.py`), `lib/governanceCopy.ts`, `lib/tiers.ts` (Hobby/Pro/Enterprise).

## How we've been working (keep doing this)

- **Opus session plans; fresh Sonnet sessions build.** Plans go in `docs/plans/<name>.md`; the
  owner runs `claude --model sonnet` → "Execute docs/plans/<name>.md". Every plan ends with a
  report at `docs/handoffs/<name>-report.md` whose last line is exactly `<!-- END OF REPORT -->`;
  the planning session watches for that line, reviews the report, checks commits against `git log`.
- Small fixes (a component, copy, a table) are done directly in the planning session.
- **Production deploys are run by the owner** (`! vercel deploy --prod --yes`); Claude Code's
  permission check blocks them for the agent. Preview deploys and pushes are fine when asked.
- After any UI change: `npm run build`, then `node pipeline/demo_screens.mjs <url>` (18-step
  rehearsal, saves `docs/demo/fallback/*.png`) and look at the changed screenshots.
- Before pushing: grep tracked files for keys/tokens. Stage explicit paths only.

## Tests and tools (all in `pipeline/`)

`check_parity.py` (numbers vs the original Streamlit app) · `check_story_figures.py` · `test_guard.mts`
· `test_ask_headline.mts` · `test_scope_gate.mts` · `eval_scope.mjs` + `ask_redteam.json`
(37 single-turn + conversation cases, verbatim production red-team prompts included) ·
`replay_conversation.mjs <url>` (six-turn red-team with real history) · `stress_ask.mjs` ·
`browser_smoke.mjs` · `demo_screens.mjs` · `measure_guard.mjs`. Playwright lives outside the repo
in `~/.cache/runbook-playwright`. Local server for tests: `ASK_ZDR=0 npm run start -- -p 3000`;
kill it afterwards (leftover servers on :3000 have caused false failures twice).

## Open items (none blocking)

1. **Turn-6 margin:** "Is that in the dataset?" after an allowed question passes at p≈0.53–0.58
   vs threshold 0.5. On stage use a fuller follow-up ("Break that down by merchant category"), or
   lower the threshold for clear follow-ups to allowed turns (update tests).
2. `ASK_DEMO_MODEL_SWITCH=1` is preview-only; add for production if switching models live on the
   subdomain.
3. Owner settings not done: GitHub branch protection on `main` (6 checks + 1 review), Vercel
   Deployment Checks, AI Gateway controls (check what Hobby offers), optionally revoke the
   automation-bypass secret.
4. `findings.md` header says 22,658 fraud; the total is 24,080 (22,658 is the `velocity_1h_count = 0`
   row). Runbook Phase 5 bug; UI uses the data.
5. P3 (Snowflake via Vercel Connect) waits on the owner's Snowflake trial; dry-run scopes first.
6. Known gaps to say out loud in the demo: AI Gateway inference regions are US/EU only; many
   governance controls are Enterprise-only (framed as the tier story); `aiGatewayGuardrails`
   exists in Vercel's API but is undocumented.

## Traps

- Hobby: ZDR requests 403, so `ASK_ZDR=0` must stay set on Vercel; removing it breaks Ask.
- `.vercelignore` entries must be root-anchored (`/patterns/`), or they drop `app/patterns`.
- A Vercel virtual model is one model with provider routing and failure fallback; it can't chain
  guardrails. Don't propose it for that.
- The owner's other site is the bare `aicriticalityindex.com`; never point the apex at this app.
- Vercel/AI SDK/Jev APIs postdate model training: read `node_modules` types and vercel.com docs.
