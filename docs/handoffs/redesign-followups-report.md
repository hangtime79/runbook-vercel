# Redesign follow-ups report

**Status:** all five steps done and verified locally and on a preview. Nothing pushed.

**Commits:** 1af03cb headline recovery · 4f82c87 explorer columns · 9682cd6 browser smoke test + CLAUDE.md · 2a9e942 export manifest · plus this report.

**Headline recovery.** The SDK explicitly never retries `ToolChoiceViolationError` (`!isToolChoiceViolation` in streamText's retry path), so `onError` retry and `streamRetries` cannot help. I replaced the forced `toolChoice` with `activeTools: ["headline"]` after a successful query (`lib/askSteps.ts`, used by the route). A step that skips the tool just writes the answer: text and evidence, no stat card. The tool description now matches (asked for right after a query, not "last"). Test: `node --no-warnings pipeline/test_ask_headline.mts` uses `MockLanguageModelV4`: headline used (answer + stat), headline skipped (answer, no stat, no error), and a witness that the old forced choice still errors. All pass. Live: 10 of 10 questions still produced a stat.

**Explorer.** Container query on the table wrapper: Subsector hides below 900px, Hour below 720px; Outcome, Transaction, Amount, Flags and Model score never hide. At 1440 with the panel open the wrapper is about 768px, so Subsector is hidden and nothing overflows; at 1920 all 9 columns show.

**Manifest.** `data/manifest.json` holds the sha256 of both parquet inputs plus the duckdb version. When they match and `fraud.duckdb` exists the export prints "fraud.duckdb: unchanged". Two consecutive runs left `git status` clean for `data/` (the first run bootstrapped the manifest against the committed binary, which I restored).

**22,658.** It is the fraud count among `velocity_1h_count = 0` rows (the first row of the Finding 1 table), which the findings header reused as the corpus total. Reproduce: `select count(*) filter (where authorized_flag = 0) from features where velocity_1h_count = 0` gives 22,658 of 248,340 (9.12%). The other 1,422 sit at velocity >= 1; together 24,080 (9.47%). `findings.md` and `NARRATIVE.md` untouched.

**Browser smoke test.** `pipeline/browser_smoke.mjs` asks one question through the UI (SQL visible, result table, no console errors or failed API calls) and checks `/explorer` overflow at 1440 and 1920. 17/17 pass. playwright-core lives in `~/.cache/runbook-playwright`, outside the repo; documented in `CLAUDE.md`.

**Verification:** build passes; parity 17/17; copy check PASS; stress 12/12 (write refused); mock test, smoke test and double export pass.

**Preview:** https://runbook-vercel-i3nze6vih-hangtime79.vercel.app. All ten routes returned 200 via `vercel curl`; one `/api/ask` question returned text, a headline call, and finished with no error.

**Needs the owner:** push the commits.
<!-- END OF REPORT -->
