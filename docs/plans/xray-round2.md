# X-ray round 2: go-to navigation, ghost stops, and the Vercel story

**Run this only after `docs/plans/xray-objections.md` has finished and been committed.** Both plans
touch `XrayLayer`, `XrayLegend`, `lib/content.ts` and the content README. Before starting, confirm
that `docs/handoffs/xray-objections-report.md` ends with `<!-- END OF REPORT -->` and that its commit
is in `git log`. If not, stop and say so.

## Context

Grant used x-ray on production. Three problems:

1. **He can't find stops.** The legend's "next" link only changes the route. It doesn't take him to the stop. A stop that isn't on screen yet is invisible, and he has no idea where it will appear. Example: stop 11, the Evidence card, only exists after you ask in stop 10.
2. **The legend should step both ways.** He likes the little legend pill and wants back and forward buttons on it.
3. **The demo tells the data story, not the Vercel story.** This is an interview for a Vercel role. Each beat needs to connect what you see to why Vercel is the right platform. This applies to:
   - the x-ray cards
   - the demo script talk track
   - the intro deck
   - the `/story` page

## Part A: navigation

**Provider state** (`components/xray/XrayProvider.tsx` and `context`)
- Add `active: number | null`, plus `goTo(n)`, `next()` and `prev()`.
- `active` is the stop whose card is pinned open.

**`goTo(n)`**
1. If the stop's route isn't the current page, `router.push(route)`.
2. If the stop's anchor lives in the Ask panel, open the panel with `setPanelOpen(true)` from `components/ask/AskProvider.tsx`. Below 1240px the panel is closed by default.
3. Wait for the anchor element. Use a `MutationObserver` with about a 3 s timeout. If the anchor never appears, fall back to the ghost stand-in (Part B).
4. Call `el.scrollIntoView({ behavior: "smooth", block: "center" })`.
   - It must work inside `#main-scroll` and the scroll-snap `#intro-deck`.
   - With `prefers-reduced-motion`, use `behavior: "auto"`.
   - On `/intro`, scrolling to a slide is the same as moving there with the arrow keys. Confirm the deck's IntersectionObserver keeps up.
5. When scrolling ends, use the `scrollend` event, or 700 ms where `scrollend` isn't supported. Then set `active = n`, which opens that badge's card and pins it.

**Pinned cards**
- The active card stays open until one of these happens:
  - you move to another stop;
  - you press Escape. Make sure it doesn't also close the Ask panel when the panel isn't the target;
  - you click outside the card.
- Hover still opens and closes cards as before.
- Clicking a badge pins that card, which is the same as `goTo` that stop with no scroll.
- Make the Radix tooltip controlled: `open = hovered || active === n`.

**Legend** (`components/xray/XrayLegend.tsx`)
- Replace the "next →" link with `‹  11 / 27 · The Evidence card  ›`.
  - The `‹` and `›` buttons call `prev()` and `next()`.
  - The middle shows the active stop, or the first stop on this page if none is active.
- Keys: `[` and `]`.
  - Same guards as the `X` key: no modifier keys, and not while focus is in an input, textarea or contenteditable element.
  - Don't use arrow keys; the intro deck owns them.
- The buttons are disabled at stop 1 and at the last stop.
- Keep the page summary: "stops 8–13 here". Keep the objections count and toggle from the objections plan.
- The pill still fits within `calc(100vw - 32px)` at 1440px with the Ask panel open.

## Part B: ghost stops (things that appear later)

- **New optional frontmatter fields on a stop:**
  - `stand_in`: the id of the element to sit on until the real one exists. Either another stop's id or a new `data-xray` id.
  - `appears_after`: the stop number that makes it appear.
  - Validate both in `lib/content.ts`. `stand_in` must resolve to an anchor and `appears_after` must be a lower stop number.
- **Rendering:**
  - While the stop's own anchor is missing, draw its badge on the stand-in's element.
  - The ghost badge has a dashed ring, about 50% opacity and no pulse.
  - Its card opens with one line: **"Appears after stop 10: click Ask first."** The normal sections follow.
  - When the real anchor shows up (the `MutationObserver` already re-scans), the badge moves there and turns solid.
- **Which stops get it:**
  - Find them by loading each route fresh with `?xray=1` and listing the stops with no anchor.
  - Expected: 11 (evidence), 17 (readout), 23 (scope card), 24 (passed footer), and maybe 25.
  - The stand-in for a panel stop is the Ask panel's input box or header, whichever is visible.
  - Put `data-xray-standin="<id>"` on the stand-in if a stop's id doesn't fit.
- **`check_xray.mts`:** a stop counts as anchored if its own anchor **or** its stand-in exists in code.

## Part C: the Vercel story

**Principle.** Every beat follows the same shape: *what they see* → *what Vercel does to make
that possible* → *why a bank should care*. The data is the proof, and Vercel is the point.

**Source rule.** Every Vercel claim comes from `docs/demo/vercel-positioning.md`,
`docs/demo/governance-research.md` or `docs/demo/objections-research.md`. Write no new claims,
and keep the script's "Do not claim" list.

**C1. The demo script (`docs/demo/demo-script.md`).** Do this first; everything else follows from it.
- Rework Act 1, and any beat elsewhere that only talks about data, so each beat ends on a platform line spoken to a person. Examples, with wording that must come from the docs:
  - **KPI cards** → server components read the data at request time, and the function runs in Sydney next to it. Idle costs nothing.
  - **Ask** → one AI Gateway integration, no stored key, any model.
- Replace "Vercel underneath (one line each, don't lecture)" with lines placed beat by beat.
- Keep timings: Act 1 stays at about 4 minutes, so cut data narration to make room.
- Put the script change in **its own commit**. In the report, list every changed or added line as before → after, so Grant can review the talk track.

**C2. X-ray cards.**
- Add a **required** `## On Vercel` section to every stop. Put it in `STOP_SECTIONS` after `## Tell`.
- Content:
  - the Vercel capability behind this element;
  - why it matters to this bank, in one or two sentences;
  - where it was sourced.
- Bridge stops name the Vercel product on the other side, such as AI Gateway logs, Deployment Protection or Instant Rollback.
- Update every card's `## Say` to the new script. Fix stop 12's out-of-date pre-gate line.
- Update stop 23's category to match the script, if C1 settles it. The live checker returns `code_request`, not `person_lookup`.

**C3. Intro deck (`content/intro/`).**
- Shift the slides toward the platform story without making them longer:
  - **Situation:** these tools are apps that need a home.
  - **Tension:** speed vs control is a platform problem.
  - **Cards:** lead with the On Vercel line.
- The words still come from the sources.
- `check_story_figures.py` must still pass.

**C4. `/story` page.**
- Add a short "On Vercel" line per chapter, plus one for the KPI row.
- These lines live in a new editable `content/story/` folder:
  - `kpis.md`
  - one file per chapter, keyed by chapter index or slug
  - each file has a single `## On Vercel` section
- Use the same loader pattern and validation as `content/intro/`. Existing story copy in `lib/copy.ts` stays where it is, because the figures check depends on it.
- Render the lines as a quiet muted line with a small Vercel triangle mark under each chapter heading.
- Document the folder in `content/README.md`.

## Files

- **Edit:**
  - `components/xray/XrayProvider.tsx`
  - `components/xray/XrayLayer.tsx`
  - `components/xray/XrayLegend.tsx`
  - `components/xray/context`
  - `lib/xrayTypes.ts`
  - `lib/content.ts`
  - `app/story/page.tsx`
  - the Ask components that hold the stand-ins
  - `content/xray/*.md` (all 27)
  - `content/intro/**`
  - `docs/demo/demo-script.md`
  - `content/README.md`
  - `pipeline/check_xray.mts`
  - `pipeline/browser_smoke.mjs`
  - `pipeline/demo_screens.mjs`
- **New:** `content/story/*.md`

## Verification

1. Run `npm run build`. A missing `## On Vercel` section or a bad `stand_in` fails the build, naming the file.
2. Run `node --no-warnings pipeline/check_xray.mts` and `uv run python3 pipeline/check_story_figures.py`.
3. Start a server: `ASK_ZDR=0 npm run start -- -p 3000`.
4. Extend `browser_smoke.mjs`:
   - On `/intro?xray=1`, press `]` 7 times. You land on `/story`, stop 8's card is open and its element is in the viewport.
   - On `/story`, `goTo(11)` before asking shows the ghost badge on the stand-in, with the "Appears after stop 10" line.
   - Ask a question. The badge moves to the Evidence card and turns solid.
   - Press `[` once and you're back on stop 10 with its card open.
   - The legend fits with no horizontal overflow at 1440px with the panel open.
5. Add `demo_screens.mjs` beats for: a ghost stop; a pinned card after `]`; a `/story` chapter showing its On Vercel line.
6. Look at the screenshots, then kill the server.
7. Run the existing checks: parity, guard, headline, scope gate.
8. Commit with explicit paths, in two or more commits; the script change gets its own. **Do not push**: a push to `main` deploys production.
9. Write `docs/handoffs/xray-round2-report.md` in no more than 450 words. Cover:
   - the ghost stops and their stand-ins;
   - the script before → after list, which may run past the word limit as an appendix;
   - check output;
   - commits.

   Its last line is exactly `<!-- END OF REPORT -->`.
