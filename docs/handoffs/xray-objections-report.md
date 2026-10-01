# X-ray objections: report

## Research (`docs/demo/objections-research.md`, accessed 2026-10-01)

36 entries (R-01 to R-36), facts split from opinion, each with quote, URL, publisher, date and access date.

| Theme | Entries | Of which unverified |
|---|---|---|
| Competitors, cost, lock-in | 19 (R-01 to R-19) | Render, OpenShift, Railway bank fit |
| Sovereignty and regulator | 10 (R-20 to R-29) | CPS 230 commencement date |
| Shadow IT | 4 own, plus R-11 | KPMG 73% figure (second-hand) |
| AI risk | 7 | Beaver benchmark; Jev not in the cited bypass studies |

## Objections (18, in `content/objections/`)

- ai-called: model-calls-leave-australia, provider-keeps-prompts
- where-runs: vercel-processes-offshore
- close-tiers: material-service-provider
- who-sees: incident-72-hours
- underneath: bill-at-scale, azure-all-in
- connect: nextjs-lock-in, snowflake-or-databricks-apps
- tiers-intro: free-tier-is-a-trial
- ask-button: ai-gets-it-wrong, explain-to-auditor
- delete-refused: checker-can-be-fooled
- change-propose: who-supports-it
- change-checks: checks-can-be-bypassed
- tension: we-already-have-a-platform
- thesis: governance-slows-us-down
- kpis: cloudflare-is-cheaper

## Unverified, flagged in the files

- **CPS 230 commencement.** One fetch said 1 July 2026, earlier research said 2025. No date is stated in any card.
- **Render and OpenShift.** The pages did not load. No claims made.
- **APRA quotes** came through a page summariser. Re-check against the PDFs.

## Checks

- Build gate: removing `## Answer` from `bill-at-scale.md` fails `npm run build`, naming the file and section. Restored.
- `check_xray.mts`: PASS (18 objections, each anchored).
- `browser_smoke.mjs`: SMOKE PASSED, including the new objection checks (badge renders, "They say" on hover, card inside 1440px, no overflow, toggle hides markers, stop badges unchanged).
- `demo_screens.mjs`: 0 console errors; new `22-xray-objection-card.png` checked by eye.
- parity, figures (102 traced), guard, headline, scope gate: all PASS.
- `content/objections/*.md` is tracked and not git-ignored; `.vercelignore` `!/content/**/*.md` covers it.

## Commits

- `a61f05f` X-ray objections: research file, 18 objection cards, amber markers, legend toggle

Not pushed.

<!-- END OF REPORT -->
