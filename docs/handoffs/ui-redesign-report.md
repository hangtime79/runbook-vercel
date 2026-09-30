# UI redesign (Geist Dark): report

**Status:** built and verified locally; **preview deploy not done** (see "Needs the owner").

**Commits (not pushed):** 184e3b2 foundation, b8bf093 data additions, 3cd4278 screens, f115175 contrast, copy check and report inputs, plus this report.

**Versions:** tailwindcss 4.3.3, shadcn 4.21.0 (radix-nova, Nova preset), geist 1.7.2, lucide-react 1.49.0, radix-ui 1.6.7, recharts 3.10.1, `cn` 0.4.0. shadcn's generated components import `cn` from that npm package (maintainer shadcn, repo shadcn-ui/cn), not clsx + tailwind-merge.

**Model-score AUC check:** `model.pkl` failed it: holdout AUC 0.7645, not 0.7640. `metrics.md` reports the early-stopping fit on 90% of the train slice, which was never saved. `model.pkl` is the refit on 100%. Owner chose: retrain the documented model in `export_web_data.py`. It reproduces `metrics.md` exactly (AUC 0.7640, PR-AUC 0.3292, best round 290, confusion 45,200 / 829 / 3,987 / 829); the export refuses to write scores otherwise. Explorer rows are the first 500 of the seeded, shuffled holdout (a random sample, not top scores); 13 sit at or above the threshold.

**Verification:** `npm run build` passes. `check_parity.py`: 17/17 PASS, including the 9 amount bands, story aggregates and triggers. `stress_ask.mjs`: 6/6 ok, write attempt refused (no SQL run). All routes return 200. `check_story_figures.py`: PASS, 101 figures traced (confirmed to fail on a changed number). Caveat: illustrative claims ("~25%", "95%", "1,500 km") trace only by the number appearing in the docs.

**Deviations from the handoff README:**
- `useChat()` defaulted to `/api/chat`, which does not exist; the old inline Ask box could not have worked in a browser. The provider now uses `/api/ask`.
- The model ignored the `headline` tool, so `route.ts` forces it after each successful query with `prepareStep`. `MAX_STEPS` is now 8. `route.ts` also adds `ms` to query output. `lib/askdb.ts` is untouched.
- Story copy: "~130 flags/year" became "127 flags in the labeled year" (findings.md); "~4× both neighbours" became a computed "~4× the $5–$10 band".
- Explorer kicker reads "Holdout sample · 500 rows". Category chart is titled top 14 (README shows 14). The amount-band caption is computed; the prototype's "97% under $1.6K" was not traceable. Heatmap legend shows the real 7.0%, not 7.4%.
- Dropped the raw amount histogram from `/patterns`; `/api/patterns` still returns it for parity.
- KPI grid min width 165px (was 180) so four cards fit beside the open panel. Muted-text contrast measured: all at or above 4.7:1; faded text was raised.
- Findings typology rows stack in narrow columns (container query).
- Accent ramp is named `signal-*` to avoid shadcn's `--accent`.

**Also noted:** findings.md says 22,658 fraud at the 9.47% baseline; the data says 24,080. The UI uses the data.

**Needs the owner:** `vercel deploy --yes` fails with "Not authorized" (CLI logged in as hangtime79); log in or fix scope for the linked project, then deploy and run `vercel curl` on each route. `/api/ask`, `/api/story` and `/brief` file tracing are untested on Vercel. Push the commits.
<!-- END OF REPORT -->
