# Demo intro report

**Status:** Steps 1–4 done. The preview deploy and its `vercel curl` checks were **not run**: the permission classifier denied `vercel deploy --yes`, so I did not retry.

## Commits on `main` (not pushed)
- `Add /intro front door, move Story to /story, add tier view`
  - `/` redirects (308) to `/intro`; Story is now `/story`.
  - `/intro` is a full-screen scroll-snap deck of 6 sections, with no sidebar and no Ask panel. Arrow keys, PageUp/PageDown and Space move a section; a progress counter shows n/6.
  - `lib/tiers.ts` feeds the tier table on `/intro` and a "Plan tiers" card on `/governance` (this deployment marked as Hobby).
  - Live figures (24,080 fraud, 9.47%) are read from data. The cluster figure ("46 merchants hold 11%") is quoted from `lib/copy.ts`.
- This report.

## Act 3 pull request
https://github.com/hangtime79/runbook-vercel/pull/1 (open, not merged, not draft). It adds the overnight window's combined rate (hours 2–6: 954 of 6,424, 14.85%) to the `/patterns` hour chart.
Branched from `origin/main`, not local `main`, so the diff is one commit: local `main` is unpushed and would have put the intro commits in the PR.
Checks: all 5 green (Build, Copy figures, Numbers match, Read-only guard, Ask loop).

## Verification (local production server, `ASK_ZDR=0`)
- `npm run build` passes.
- Parity: all PASS, including the new overnight aggregate.
- `check_story_figures.py`: PASS.
- `test_guard.mts` and `test_ask_headline.mts`: PASS.
- `browser_smoke.mjs`: PASSED. New checks: redirect, no sidebar, ArrowDown, Start → `/story`, tier card, no overflow at 1440 and 390.
- `stress_ask.mjs`: 6/6.
- Not done: `vercel deploy --yes` and `vercel curl` of the routes.

## Owner to-do
1. Run `vercel deploy --yes` from `main`, then `vercel curl` `/`, `/intro`, `/story`, `/governance`, `/ask` and the APIs.
2. Push `main`. The PR is based on `origin/main` and should merge cleanly.
3. `vercel git connect`, so PR #1 gets a protected preview.
4. Optionally set `NEXT_PUBLIC_DEMO_PR_URL` to the PR URL; the intro card otherwise links the repo's pull requests page.
5. Verify the APRA quote on `/intro` against the PDF.
6. `docs/demo/demo-script.md` has a stray malformed row after the tier table. I left it.

<!-- END OF REPORT -->
