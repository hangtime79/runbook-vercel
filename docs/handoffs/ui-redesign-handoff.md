# UI redesign (Geist Dark): handoff

Written for the conversation that picks this up. The short report is `ui-redesign-report.md`; this file says what exists, how it fits together, what is unfinished and what to watch for.

## Where things stand
Steps 1–7 of `docs/plans/ui-redesign-geist-dark.md` are done and verified locally. **Step 8 is not done**: `vercel deploy --yes` fails with "Not authorized" (CLI logged in as hangtime79, project linked in `.vercel/`). Nothing is deployed, so there is no preview URL. Five commits sit on `main`, none pushed (the repo is public; the owner pushes).

Commits: 184e3b2 foundation · b8bf093 data additions · 3cd4278 screens · f115175 contrast, copy check, `max_rounds` · plus the report commit.

## The first thing to do
1. The owner fixes Vercel access (login or scope for the linked project).
2. `vercel deploy --yes` (preview only; never `--prod`, `vercel setup`, `vercel env`, `vercel link`).
3. `vercel curl` each route: `/`, `/findings`, `/patterns`, `/model`, `/explorer`, `/ask`, `/brief`, `/api/stats`, `/api/story`, `/api/patterns`. Ask one question through `/api/ask`.
4. Untested on Vercel: file tracing for `/api/ask`, `/api/story` and `/brief` (`next.config.ts` `outputFileTracingIncludes`), and gateway auth through the deployment's OIDC token.
5. Fill the preview URL into `ui-redesign-report.md` (it currently says "not done").

## What was built
- **Foundation:** Tailwind 4.3.3, shadcn 4.21.0 (radix-nova), geist 1.7.2, lucide-react 1.49.0. Dark only. Tokens are in `app/globals.css`; the fraud ramp is `signal-100..900` (named to avoid shadcn's `--accent`). shadcn components import `cn` from the npm package `cn` 0.4.0 (shadcn's own), not clsx/tailwind-merge.
- **Shell:** `components/shell/AppShell.tsx` (sidebar, phone top bar, Ask panel, phone full-screen sheet). `components/ask/AskProvider.tsx` holds the one `useChat` in the root layout, so the panel and `/ask` share a conversation. `AskView.tsx` is the UI; `Evidence.tsx` is the SQL card.
- **Screens:** `app/page.tsx` (Story, with `components/story/StoryRail.tsx` and an IntersectionObserver), `findings`, `patterns` (Recharts hour and amount charts, CSS heatmap and category bars), `model`, `explorer` (`components/explorer/ExplorerTable.tsx`), `ask`, `brief` (renders `data/docs/NARRATIVE.md`).
- **Data flow:** live figures come from `lib/queries.ts` (DuckDB), `lib/story.ts`, `lib/findings.ts` (parses tables in `findings.md`) and `data/model_summary.json`. Static editorial copy is only in `lib/copy.ts`.
- **Removed:** `components/AskData.tsx`, `Charts.tsx`, `Markdown.tsx`.

## Data and pipeline changes
- `pipeline/export_web_data.py` now also writes `data/explorer_rows.parquet` (500 rows) and `data/model_summary.json`. Run it with `uv run python3 pipeline/export_web_data.py`. It rebuilds `data/fraud.duckdb` as a side effect, which changes that binary; I restored the committed copy with `git checkout data/fraud.duckdb` each time. Do the same unless the tables change.
- `pipeline/parity_reference.py` and `.json` gained `amount_bands` and `story`; `check_parity.py` covers them (17 checks). New endpoint `/api/story`; `/api/patterns` also returns `amountBands`.
- New `pipeline/check_story_figures.py`: extracts numbers from `lib/copy.ts` and traces each to the parity JSON, `model_summary.json` or the docs. Caveat: it matches integers in the docs by presence, so illustrative claims ("~25%", "95%", "1,500 km in 3 minutes") pass without a real source.

## Decisions to know about
- **Explorer scores are not from `model.pkl`.** `model.pkl` (refit on 100% of train) scores holdout AUC 0.7645; `metrics.md` documents 0.7640, from an early-stopping fit that was never saved. The owner chose to retrain that documented model inside the export. It reproduces `metrics.md` exactly, and the export aborts if AUC, PR-AUC, best round or the confusion matrix drift. `model.pkl` still supplies feature order, threshold and the merchant-rate map (cross-checked).
- **Explorer rows** are the first 500 of the seeded, shuffled holdout (a random sample, out-of-sample scores), sorted by score in the UI; 13 are at or above threshold. "Hot merchant" means a training-slice merchant rate above 3× baseline.
- **Ask changes (`app/api/ask/route.ts`, `lib/askPrompt.ts`):** added a `headline({value,label})` tool that only echoes its input. The model ignored it when merely asked, so `prepareStep` forces it after each successful query (never after a failed or refused one). `MAX_STEPS` went 6 → 8. Query output now carries `ms`. `lib/askdb.ts` and the gateway wiring are untouched.
- **Bug fixed:** the old `useChat()` defaulted to `/api/chat`, which does not exist. The provider uses `DefaultChatTransport({ api: "/api/ask" })`.
- Other deviations from the handoff README are listed in `ui-redesign-report.md`.

## Verification already run (local production build)
`npm run build` passes · parity 17/17 · `stress_ask.mjs` 6/6, write attempt refused · every route 200 · copy check PASS · browser screenshots at 1440 and 390 wide (no horizontal scroll, no console errors) · phone Ask sheet works. Muted text measured at 4.7:1 or better on `#0a0a0a`.

## Open issues
- **Forced headline flake:** one stress run hit `AI_ToolChoiceViolationError` (model returned nothing valid on the forced step, finishReason `other`) and the stream failed on the heaviest question. Five later runs of that question and a full 6/6 rerun were clean. If it recurs, make the forcing non-fatal (for example catch the violation and let the answer stand without a stat).
- **Explorer width:** with the Ask panel open at 1440px the table scrolls horizontally inside its box and the Model score column starts near the edge. It fits with the panel collapsed.
- **Data inconsistency:** `findings.md` says 22,658 fraud at the 9.47% baseline; the data says 24,080. The UI uses the data; the doc is wrong.
- The earlier P2 open items still stand: occasional early stream ends and unverified OIDC gateway auth on Vercel.

## Handy
- Local run: `npm run build && npm run start` (port 3000). Browser checks used `playwright-core` installed in the session scratchpad, not in the repo.
- Do not use `python -c`, `pip`, `git add -A`, or push. `scripts/` and `artifacts/` are gitignored.

<!-- END OF REPORT -->
