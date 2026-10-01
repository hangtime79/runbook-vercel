# X-ray mode: report

**Built.** All 27 stops in `content/xray/` (filename prefix = marker number); six are bridge stops (14, 16, 17, 18, 20, 21). The intro deck's words moved word for word into `content/intro/` (6 slides, 4 cards); `INTRO` is gone from `lib/introCopy.ts`. `content/README.md` is Grant's guide.

**Order held.** I saved intro screenshots before touching code. After the migration all six are byte-identical (`cmp`). Then x-ray went on top.

**Anchors.** None moved from the plan, with these choices:
- Stop 13 is on the Story `h1`.
- Stops 4 and 5 are one badge per card.
- Stop 25 falls back to the readout when the model switch is off.
- Stops 18, 20, 21 sit in a row on Change control.
- Routes run forward (1–7 `/intro`, 8–13 `/story`, 14–27 `/governance`), so the legend's "next" always advances.

**Deviations.**
- `## Say` is optional: stops 7, 9, 10, 13 have no quoted script line, and I did not invent one.
- Stops carry a `title`; intro cards carry `text` and `vercel`.
- The build gate is `validateAllContent()` in `next.config.ts`, because `/intro` is dynamic and would skip validation at build.
- `check_story_figures.py` scans `content/intro/` and exempts the APRA citation line.
- `tooltip.tsx` gained an optional `arrow` prop.

**Checks.**
- Dropping `title:` from `03-thesis.md` fails the build, naming file and field. Restored.
- A dev edit to a Say line and an intro title showed on refresh without a restart. Reverted.
- `content/` is in the `.nft.json` for `/intro`, `/story`, `/governance`, `/explorer`.
- `check_xray.mts` passes; a fake stop and a numbering gap both fail it.
- `browser_smoke.mjs`: 70 PASS, 0 FAIL. Parity, figures, guard, headline and scope-gate checks all exit 0.

**Screenshots looked at.** Intro slides 1, 3, 4; Story; Governance; the Ask scope-check card; old and new Governance side by side. Badges sit on the right elements; typing "x" in the Ask box does not toggle. With x-ray off, the only change is the sidebar switch row. Long cards (23, 24) scroll inside the card.

**Notes.**
- `demo_screens.mjs` regenerated the old shots; I restored them and committed only the four new ones (19–22). Beat 13 failed locally (no `ASK_DEMO_MODEL_SWITCH=1`).
- The live checker labelled the "Python" question `code_request`, not the script's `person_lookup`. Check before the demo.
- `docs/plans/xray-mode.md` is still untracked.

**Commits.** One commit on `main`. Not pushed or deployed.

<!-- END OF REPORT -->
