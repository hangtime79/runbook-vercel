# Rehearsal: walk every x-ray stop, a printable run sheet, and a fresh handoff

## Context

The demo is now:
- the app;
- x-ray mode: 27 stops, ghost stops, go-to navigation with `[` and `]`;
- 25 objections;
- a fact-checked script.

Each piece was built and tested separately. **Nobody has walked the whole route end to end** the way
Grant will on the day. This plan does that with a browser, measures whether the talk tracks fit the
script's time budget, gives Grant a printable run sheet generated from the content files, and
brings `docs/handoffs/SESSION-HANDOFF.md` up to date. It is still at 2026-09-30, from before x-ray.

**Wording is Grant's.** Do not edit `content/` or `docs/demo/demo-script.md` wording. Put
suggested wording changes in the report. Code fixes for friction (clipping, scrolling, anchors) are
in scope.

## Part 1: fast-run stepping

- Add `fast` mode to x-ray. Turn it on with `?xray=fast`, or with a small "Fast" toggle in the legend.
- In fast mode, `[`, `]` and the legend buttons step only through stops with `fast: keep`.
- The legend shows `‹ 4 / 9 (fast) · title ›`, counting fast stops only. Badges for skipped stops are dimmed but stay visible.
- Check the stop list against the script's "Fast run" table at the end of `demo-script.md`. List any mismatch in the report. Don't change the `fast:` values; that's Grant's call.

## Part 2: the walk-through (`pipeline/rehearse.mjs <base_url>`)

**Setup**
- Use playwright-core from `~/.cache/runbook-playwright`, the same setup as `browser_smoke.mjs`.
- Viewport 1440×900.
- Run against a local production build: `ASK_ZDR=0 npm run start -- -p 3000`. The deployed site sits behind Vercel Authentication. Don't use the automation bypass secret.

**Full run**
- Start at `/intro?xray=1` and press `]` from stop 1 to stop 27.
- At each stop, check that:
  - the URL is the stop's `route`;
  - its badge is solid, or ghost if the stop hasn't appeared yet;
  - its pinned card is open;
  - the anchor element is at least 50% inside the viewport;
  - the whole card is inside the viewport, or scrolls inside itself with no page overflow;
  - there are no console errors and no failed `/api/` requests.
- Where the script has the presenter act, perform the stop's `## Show` action before moving on. These live model calls cost a few cents in total:
  - stop 10: click the Ask button;
  - stop 12: type the delete question;
  - stop 23: type the Python person-lookup question;
  - the follow-up real question.
- Then confirm the ghost stops (11, 17, 23, 24, 25) turn solid on the real element.
- Save a screenshot at each stop to `docs/demo/rehearsal/NN-<id>.png`.
- Also hover each page's objection badge once. Check that its card fits, and screenshot the first one.

**Fast run**
- Repeat with `?xray=fast`. Fast mode should land only on `fast: keep` stops, in order.

**Record each stop** in `docs/demo/rehearsal/results.json`: pass or fail per check, and the time to scroll and open the card.

**Fix friction in code, then re-run.** Examples: a card that clips, an anchor that ends up off-screen after the panel opens, a ghost that never resolves. Each fix gets a line in the report.

## Part 3: does the talk fit the time?

New script: `pipeline/talk_time.mts`. It reads `content/xray/*.md` and works out:
- for each stop, the words in `## Say`;
- the estimated spoken seconds for each stop, at 140 words per minute;
- the total for each act, compared with that act's budget in `demo-script.md` (e.g. Act 1 = 4 min).
  - Do the same for the fast run against 5 minutes.

The script prints a table. **In the report, show the working the way Grant asks for it.** Name the
variables and give their values, then show the calculation as a chain: the formula, then the same
formula with numbers substituted, then the result. One row per act, in a table. For example:

| Act | `say_words` (sum of Say words) | `wpm` | `say_words / wpm * 60` | `budget_seconds` | Over or under |
|---|---|---|---|---|---|
| Act 1 | 412 | 140 | 412 / 140 * 60 == 176.6 s | 240 | 63 s spare |

Below the table, add a note on what the estimate leaves out: clicking, typing and model wait. The
Ask answer takes about 7–8 s, and the checker about 1 s.

Flag every act over budget. Suggest cuts, by stop, **in the report only**.

## Part 4: printable run sheet (`pipeline/build_run_sheet.mts` → `docs/demo/run-sheet.md`)

- Generate it from `content/xray/`, `content/objections/` and `demo-script.md`'s timings, so it never drifts from the cards.
- **Layout:** one section per act, showing the time budget and estimated talk time. Under each act, one row per stop:
  - number and title;
  - fast keep or skip;
  - the **first sentence** of `## Say`;
  - the `## Show` action;
  - the objections anchored to that stop, as titles only.
- **Header:** the date generated, and the result of the source freshness check.
- Add the generator to `pipeline/check_xray.mts` as a "run sheet is current" check. It fails if `run-sheet.md` differs from a fresh generation, so a content edit reminds you to regenerate the sheet.
- Also produce a print-friendly HTML version, `docs/demo/run-sheet.html`: A4, one act per page, readable at arm's length. The Markdown stays the source.

## Part 5: refresh the fallback screenshots

- Run `node pipeline/demo_screens.mjs http://localhost:3000` on the current build.
- Commit the updated `docs/demo/fallback/*.png` **only after looking at each changed one**.
- Kill the server afterwards.

## Part 6: rewrite `docs/handoffs/SESSION-HANDOFF.md`

Same structure, brought up to date (verify each item against the repo and `git log`):
- **Production commit:** the commit production now runs. Run `vercel inspect https://runbook-vercel.aicriticalityindex.com` to find it.
- **Push = deploy.** A push to `main` deploys production with no wait for checks.
- **What's been built:** x-ray mode, ghost stops, go-to, fast mode, objections, and the "On Vercel" sections.
- **Editable content:** the `content/` folders (`intro`, `story`, `xray`, `objections`) and `content/README.md`.
- **Research:**
  - the three source files plus `verification-2026-10.md`;
  - `docs/demo/leads/` holds unverified leads only;
  - `check_sources_fresh.mjs` runs before each demo.
- **Workflow:** `plansDirectory` is now `docs/plans`, plus the existing plan → Sonnet → report workflow.
- **Tests and tools:** add `check_xray.mts`, `rehearse.mjs`, `talk_time.mts`, `build_run_sheet.mts` and `check_sources_fresh.mjs`.
- **Open items:**
  - owner settings (branch protection, Deployment Checks, Enforce Sensitive Environment Variables, the model switch on production, the bypass secret);
  - Grant's own checks (APRA PDFs, the CPS 230 date, Pro regions in the dashboard);
  - the turn-6 margin;
  - `findings.md` 22,658 vs 24,080;
  - P3 Snowflake.
- **Traps to add:**
  - `*.md` in `.vercelignore`: content needs the `!` rule;
  - a pushed commit is live within a minute;
  - Gemini or other model output is a lead, never a source.
- Keep it under about 120 lines.

## Verification

1. Run `npm run build`, `node --no-warnings pipeline/check_xray.mts` (including the run-sheet check) and `uv run python3 pipeline/check_story_figures.py`.
2. Run `node pipeline/rehearse.mjs http://localhost:3000`. Both runs pass at every stop. If a stop fails because of wording or content, record it in the report instead of forcing a pass.
3. Run `browser_smoke.mjs`. The existing parity, guard, headline and scope-gate checks still pass.
4. Run `node --no-warnings pipeline/talk_time.mts` and paste its table into the report in the format above.
5. Open `run-sheet.html` in Chromium and print it to PDF. Look at the PDF to check page breaks. Don't commit the PDF.
6. Kill every server on :3000.
7. Commit with explicit paths, in separate commits:
   - fast mode;
   - the rehearse script and its fixes;
   - the talk-time script and the run sheet;
   - the screenshots;
   - the handoff.

   **Do not push.**
8. Write `docs/handoffs/rehearsal-report.md` in no more than 500 words, not counting the talk-time table. Include:
   - pass or fail per stop, summarised;
   - the friction fixed;
   - fast-run mismatches against the script;
   - the talk-time table, with acts over budget and suggested cuts;
   - suggested wording changes, listed by file;
   - commits.

   Its last line is exactly `<!-- END OF REPORT -->`.
