# Redesign follow-ups report

**Status:** all five steps done; verified locally and on a preview. Nothing pushed.

**Commits:** 1af03cb headline · 4f82c87 explorer · 9682cd6 smoke test and CLAUDE.md · 2a9e942 manifest · plus this report.

**Headline recovery.** The SDK never retries `ToolChoiceViolationError` (`!isToolChoiceViolation` in streamText's retry path), so `onError` retry and `streamRetries` cannot help. The forced `toolChoice` is replaced by `activeTools: ["headline"]` after a successful query (`lib/askSteps.ts`). A step that skips the tool just writes the answer: text and evidence, no stat. The tool description now matches the behaviour. Test: `node --no-warnings pipeline/test_ask_headline.mts` (SDK `MockLanguageModelV4`): headline used, headline skipped (answer, no error), and a witness that the old forced choice still errors. All pass. Live, 10 of 10 questions still produced a stat.

**Explorer.** Container query on the table wrapper: Subsector hides below 900px, Hour below 720px; Outcome, Transaction, Amount, Flags and Model score always show. At 1440 with the panel open Subsector is hidden and nothing overflows; at 1920 all 9 columns show.

**Manifest.** `data/manifest.json` holds the sha256 of both parquet inputs and the duckdb version. On a match the export prints "fraud.duckdb: unchanged". Two runs left `data/` clean in git.

**22,658** is the fraud count among `velocity_1h_count = 0` rows (first row of the Finding 1 table), reused as the corpus total in the header. Query: `select count(*) filter (where authorized_flag = 0) from features where velocity_1h_count = 0` gives 22,658 of 248,340. The other 1,422 sit at velocity ≥ 1; together 24,080 (9.47%). Docs untouched.

**Smoke test.** `pipeline/browser_smoke.mjs`: one question through the UI (SQL visible, result table, no console errors or failed API calls) plus `/explorer` overflow at 1440 and 1920. 17/17 pass. playwright-core is in `~/.cache/runbook-playwright`, outside the repo; documented in `CLAUDE.md`.

**Verification:** build; parity 17/17; copy check PASS; stress 12/12 with the write refused; mock, smoke and double-export all pass.

**Preview:** https://runbook-vercel-i3nze6vih-hangtime79.vercel.app. Ten routes returned 200 via `vercel curl`; one `/api/ask` question returned text and a headline call, and finished with no error.

**Needs the owner:** push the commits.
<!-- END OF REPORT -->
