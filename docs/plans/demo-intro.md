# Demo intro page, tier view, and the Act 3 pull request (execution plan for a Sonnet session)

Hand this file to a fresh Claude Code session in the repo root. Execute it top to bottom.

## Context

The demo (`docs/demo/demo-script.md`) is an interview pitch played as a meeting with an
Australian bank's CIO and Head of Fraud. The presenter wants the presentation itself to start
inside the app, so there is no switch from slides to product. This plan adds:
1. `/intro`: the opening, and the app's new front door.
2. The Hobby / Pro / Enterprise tier view on `/intro` and `/governance`.
3. A real pull request, prepared in advance, for Act 3 (change control), so its protected
   preview and green checks are ready on stage.

## Rules

- Read `CLAUDE.md`, `SPEC.md`, `docs/demo/demo-script.md`, `docs/demo/governance-research.md`,
  `docs/demo/vercel-positioning.md`.
- **Copy rules:** the customer is "an Australian bank". Never "card issuer", never a real or
  invented bank name. Vercel and APRA claims only from the two research files, and APRA quotes
  carry a small "verify against APRA PDF" note in code comments (not on screen). Numbers come
  from data (existing queries / `lib/story.ts` / `data/*.json`), never typed; any number in static
  copy goes in `lib/copy.ts` so `pipeline/check_story_figures.py` covers it.
- Next.js 16 App Router conventions (redirects, route moves): read the installed docs; not memory.
- Python: uv only, write then `uv run python3 <file>`. Never `python -c`, never pip.
- Git: explicit paths; never `git add -A` / `.` / `commit -a`. Commit per step on `main`.
  **Do not push `main`.** The only push allowed is the Act 3 branch in Step 4.
- Never `vercel setup`, `vercel env`, `vercel link`, `vercel git connect`, `--prod`.
  `vercel deploy --yes` (preview) is allowed at the end.
- Do not weaken `lib/askdb.ts`. Keep every SPEC invariant. Keep the Geist Dark design system.

## Step 1 — `/intro` is the front door; Story moves to `/story`

- `/` redirects to `/intro` (permanent redirect in `next.config.ts` or the documented App Router
  way). Story moves from `app/page.tsx` to `app/story/page.tsx`.
- Update every link to the Story: sidebar (Story stays item `01`), chapter rail, "Open the model"
  buttons, `/governance` links, `pipeline/browser_smoke.mjs`, `pipeline/stress_ask.mjs` if it
  loads pages, the CI workflow if it hits `/`, `README.md`, `CLAUDE.md`, and the demo script's
  route references.
- `/intro` renders **without the sidebar and without the Ask panel** (full-screen). Use a route
  group or layout split, whichever the docs recommend; the rest of the app keeps its shell and
  the shared `useChat` provider.

## Step 2 — Build `/intro`

Full-screen sections, one idea per screen, like slides: CSS scroll-snap; **Arrow keys / PageUp /
PageDown / Space** move section by section; a small progress indicator (1/6 …); still scrolls
normally on touch and for anyone opening the link later. Respect `prefers-reduced-motion`.
Sections:

1. **The situation.** Kicker "An Australian bank · fraud operations". Headline: a fraud wave,
   investigators built their own tools, one of them cracked a ring. Two or three big figures from
   data: confirmed fraud (24,080), the merchant cluster (46 merchants, share of all fraud from
   `findings.md`/story data), fraud rate 9.47%. Line: "This app is one of those tools."
2. **The tension.** Two columns: *Head of Fraud*: "Keep the speed. My investigators found the
   ring." / *CIO*: "I keep inheriting apps I didn't build, and I'm accountable for them." Across
   both, a band: **APRA**, with the April 2026 AI-letter line on AI-assisted development straining
   change and release management (quote exactly as in `governance-research.md`), cited as
   "APRA letter to industry on AI, 30 April 2026".
3. **The thesis.** Large type: "The CIO owns the platform. The fraud team owns the apps."
   Sub-line: "Every app, however it was built, lands on the same rails: identity, review,
   logging, rollback."
4. **What you'll see.** Four cards, each linking to its screen: *The fraud team's app* → `/story`
   · *Ask the data, with evidence* → `/ask` · *On the CIO's rails* → `/governance` · *AI in
   development, under change control* → the Act 3 PR URL (Step 4; read from
   `NEXT_PUBLIC_DEMO_PR_URL` if set, else the repo's pull requests page).
5. **Three tiers.** The Hobby / Pro / Enterprise table from the demo script (Step 3's shared data).
   Headline: "Everything you'll see runs on Vercel's free tier."
6. **Start.** One primary button "Start the demo →" to `/story`. Small footer: "Built by coding
   agents from a written runbook · Next.js · AI SDK · AI Gateway · Vercel".

## Step 3 — One source for the tiers; show them on `/governance`

`lib/tiers.ts`: the three-column tier rows exactly as in the demo script's "Three tiers" table.
`/intro` section 5 and a new "Plan tiers" card on `/governance` both render it. On `/governance`,
mark which tier this deployment is on (Hobby) and which rows are live here vs. "Pro adds" /
"Enterprise adds". Keep the existing ZDR-off notice.

## Step 4 — The Act 3 pull request (prepared, not merged)

On a branch `demo/act3-overnight-annotation` from the updated `main`:
- A small, real, visible change: on `/patterns`, add to the hour chart an annotation for the
  overnight window's combined fraud rate (hours 2–6), computed in DuckDB via `lib/source.ts`
  (not typed), added to `pipeline/parity_reference.py` + `check_parity.py`, and any number in its
  caption in `lib/copy.ts`.
- Commit message and PR description written as a coding agent's change: what, why, and "Checks:
  build, parity, copy figures, read-only guard, ask loop".
- `git push origin demo/act3-overnight-annotation`, then `gh pr create --base main` (not draft)
  with that description. **Do not merge.** Record the PR URL. Checks must be green on GitHub
  (`gh pr checks <n> --watch`).
- Note: the PR's own Vercel preview appears only after the owner runs `vercel git connect`;
  say so in the report.

## Verification

1. `npm run build`; parity all PASS (incl. any new aggregate); `check_story_figures.py` PASS;
   `test_guard.mts` and `test_ask_headline.mts` PASS.
2. `node pipeline/browser_smoke.mjs http://localhost:3000` passes; extend it: `/` redirects to
   `/intro`; `/intro` has no sidebar; ArrowDown moves one section; "Start the demo" reaches
   `/story`; `/governance` shows the tier card; no horizontal overflow at 1440 and 390 wide.
3. `node pipeline/stress_ask.mjs http://localhost:3000 1` → 6/6 (run the server with `ASK_ZDR=0`;
   the team is on Hobby).
4. `vercel deploy --yes` from `main`'s head (not the PR branch); `vercel curl` `/` (expect
   redirect), `/intro`, `/story`, `/governance`, `/ask` and the APIs → 200; one `/api/ask`
   question finishes.

## Report

`docs/handoffs/demo-intro-report.md` (≤ 350 words): status, commits on `main`, the PR URL and its
check results, verification results, preview URL, what the owner must do (push `main`,
`vercel git connect` so the PR gets a preview, set `NEXT_PUBLIC_DEMO_PR_URL` if wanted). Commit it
by path on `main`. The last line must be exactly:
<!-- END OF REPORT -->
