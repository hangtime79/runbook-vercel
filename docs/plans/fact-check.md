# Fact-check the Vercel claims, verify the Gemini leads, and add the missing objections

## Context

The demo's Vercel and APRA claims live in three source files:
- `docs/demo/vercel-positioning.md`
- `docs/demo/governance-research.md`
- `docs/demo/objections-research.md`

The x-ray cards, objections and script cite them. So far they've been checked only for internal
consistency, never re-verified against the live pages. A review on 2026-10-01 found:
- **One error.** `content/objections/bill-at-scale.md` says memory "bills while a request is in flight" and "nothing is charged between requests". R-02 and `vercel-positioning.md` §6 say memory keeps billing for the life of the instance.
- **One likely stale fact.** `vercel-positioning.md` describes a 250 MB function bundle limit with 5 GB as "Large functions beta". Vercel has since announced up to 5 GB on Fluid compute. Find the changelog.

Grant also collected leads from Gemini: `docs/demo/leads/gemini-2026-10-01.md`, numbered L-01 to L-23. They are **unverified**, and several look out of date. Treat them as a list of things to check, never as a source.

This is an interview for a Vercel role. One wrong Vercel fact in front of a bank CIO costs more than a missing one.

## Part 1: re-verify every cited Vercel URL

1. **Collect the claims.** Pull every Vercel URL from the three source files.
2. **Check each claim against its live page.** Use WebFetch. Where a page is summarised, quote the exact sentence.
3. **Record the results** in a new file, `docs/demo/verification-2026-10.md`. It holds one table:
   - Columns: claim · file and line · URL · status · evidence quote · date checked.
   - Status is **confirmed**, **changed** (give the new value), **gone**, or **couldn't load**.
4. **Fix the source files** for every *changed* or *gone* row. Keep the old value in a short "was:" note.
5. **Mark when each file was checked.** Add `Last verified: 2026-10-DD` at the top of each of the three files.
6. **Check the tagline.** Search all of `content/`, `lib/*Copy.ts` and the script for "Frontend Cloud" and any other old tagline, against the script's "Do not claim" list.
7. **Out of scope: APRA quotes and the CPS 230 date.** Grant checks those against the PDFs himself. Leave them marked unverified.

## Part 2: verify the Gemini leads

- **Look for a primary source for each lead L-01 to L-23.** Primary sources are:
  - Gartner's or Forrester's own pages, or Vercel's page quoting them
  - Vercel docs or changelog
  - a competitor's own pricing or docs page
- **Record verified leads** as new `R-` entries in `objections-research.md`, in the existing format.
- **Record the rest** in a "Leads not confirmed" section, with what you found.
- **Priority order:**
  1. **L-04: a 2026 supply-chain or security incident involving a Vercel integration, and the Forrester note.** Find Vercel's own security bulletin or blog post. Record:
     - what happened;
     - the date;
     - what customers had to do;
     - what Vercel changed afterwards.

     If it's real, it is the objection most likely to come from a bank CIO.
  2. **L-11, L-16 and L-22: background work, WebSockets and limits.** Check the current state of:
     - WebSockets in Functions;
     - Workflow;
     - Queues;
     - Sandbox;
     - `waitUntil`;
     - the maximum duration per plan;
     - the 4.5 MB body limit;
     - GPUs.
  3. **L-15: VPC.** Check Secure Compute's scope and plan.
  4. **L-12: support and suspensions.** Look for Vercel's fair-use or suspension policy and its support tiers.
  5. **The rest, in order:** L-01 to L-03 (analyst placement), L-10 (debugging: observability, logs, tracing), L-13, L-14, L-08.

## Part 3: fix the content, then add objections

- **Fix existing cards.** Correct `bill-at-scale.md`, and any other card or x-ray `## On Vercel` section that cites a *changed* or *gone* row. Use `rtk proxy grep` to find the citations.
- **Add new objection files** in `content/objections/`. Use the existing format and anchor to existing stop ids. Write one only where Part 2 confirmed the facts. Candidates:
  - `security-incident`: L-04. Who: CIO. Theme: a new `trust` theme, added to the allowed list in `lib/xrayTypes.ts` / `lib/content.ts`. Anchor: `who-sees` or `close-tiers`. The answer must state what happened plainly.
  - `long-running-work`: L-11 and L-16.
  - `no-vpc`: L-15. The answer is Secure Compute on Enterprise.
  - `debugging-black-box`: L-10.
  - `support-and-suspension`: L-12.
  - `netlify-built-ins`: L-14.
  - `analyst-view`: L-01 to L-03. Only if they're confirmed, with exact wording and year.
- **Rules carry over from `docs/plans/xray-objections.md`:**
  - be honest when a competitor wins;
  - write no claim without an `R-` entry;
  - keep the "Do not claim" list.

## Part 4: keep it fresh

- **New script: `pipeline/check_sources_fresh.mjs`.**
  - It reads `Last verified:` in the three source files.
  - It prints the age of each.
  - It exits 1 if any file is older than 30 days, or if the date is missing.
- **Keep it out of CI.** It would go red on unrelated PRs with no code change.
- **Add it to the demo checklist** ("Before the demo") in `demo-script.md` as a row: "Sources verified in the last 30 days: run `node pipeline/check_sources_fresh.mjs`".

## Verification

1. Run `npm run build`, `node --no-warnings pipeline/check_xray.mts` and `uv run python3 pipeline/check_story_figures.py`.
2. Run `node pipeline/check_sources_fresh.mjs`. It should pass. Then set one date to 2026-08-01 and confirm it fails. Revert.
3. Start a server with `ASK_ZDR=0 npm run start -- -p 3000`, run `browser_smoke.mjs`, then kill the server.
4. Commit with explicit paths, in separate commits:
   - the verification file and source fixes;
   - the new research entries;
   - content fixes and new objections;
   - the freshness script.

   **Do not push.**
5. Write `docs/handoffs/fact-check-report.md` in no more than 450 words. Include:
   - counts: confirmed, changed, gone, couldn't load;
   - every *changed* claim, before → after;
   - what was found on L-04, in plain words;
   - which leads were confirmed and which weren't;
   - the new objections and their anchors;
   - commits.

   Its last line is exactly `<!-- END OF REPORT -->`.
