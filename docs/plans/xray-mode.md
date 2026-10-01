# X-ray mode — demo coaching overlay

## Context

Grant uses this app as the prop in a job-interview pitch played as a customer meeting
(`docs/demo/demo-script.md`). He wants an **x-ray mode**: glowing numbered markers on every element
the script talks about. Hovering a marker shows a card explaining what the element is, why you're
talking about it now, the talk track, and why it matters to the client. Moving off the marker hides
the card.

The mode serves **two audiences**:
1. **An SE learning the demo.** It shows the route, the talk track and the traps.
2. **A hiring panel.** It shows how Grant thinks about demo craft, such as Tell-Show-Tell and
   showing the outcome first.

The mode is quiet but not hidden: a small switch, the `X` key, or `?xray=1`. It runs on production.

**Grant edits the words himself.** The intro deck text and every x-ray card come from markdown
files in `content/`. Grant changes and formats them without an agent. See "Editable content" below.
**Order of work:** build the content loader and migrate the intro first, and prove it renders
identically. Then build x-ray on top of it.

## Design

**Toggle**
- The same control turns the mode on and off.
- Three ways to toggle it:
  - **Sidebar switch:** a small "X-ray" switch at the bottom of the sidebar (`components/shell/AppShell.tsx` Sidebar).
  - **`X` key:** works when there are no modifier keys and focus is not in an input, textarea or contenteditable element. The Ask box must keep receiving "x".
  - **URL:** `?xray=1` turns it on and `?xray=0` turns it off. Read the URL in a `useEffect` from `window.location.search`. Do not use `useSearchParams`, which forces Suspense boundaries.
- The mode is off by default and its state lives only in React. It survives client-side navigation and resets on a full reload.
- On `/intro`, which has no sidebar, use the `X` key or the URL. Also show a tiny "X-ray on" pill while the mode is on.
- Below 768px the mode is disabled. This is a desktop rehearsal tool.

**Markers**
- Elements opt in with `data-xray="<stop-id>"`. To put several stops on one element, separate the ids with spaces.
- One client layer, `components/xray/XrayLayer.tsx`, is mounted by `XrayProvider` in `app/layout.tsx` next to `AskProvider`, so it also covers `/intro`.
- When the mode is on, the layer finds `[data-xray]` elements. It re-scans with a `MutationObserver`, because the Ask panel's evidence and scope-check cards appear later. It positions badges with `getBoundingClientRect`:
  - It recalculates on scroll (capture listener, which covers `#main-scroll` and `#intro-deck`) and on resize, throttled with `requestAnimationFrame`.
- Overlay: `position: fixed; inset: 0; pointer-events: none; overflow: hidden`. The badges themselves take pointer events.
  - This is required so `browser_smoke.mjs` sees no horizontal overflow.
  - Clamp each badge inside the viewport.
- Badge: a 22px circle holding the global stop number, with a pulsing glow ring.
  - Add a new `--xray` token in `app/globals.css`. Use a cyan or teal, not the signal red, so markers aren't read as fraud alerts.
  - Respect `prefers-reduced-motion`.
- If several stops sit on one element, their badges are placed in a row.

**Hover card**
- Use the existing, unused Radix tooltip in `components/ui/tooltip.tsx`.
- Mount one `TooltipProvider` inside `XrayProvider` with a delay of about 0.
- The card opens on hover and on keyboard focus, and closes when the pointer leaves. Collision handling keeps it on screen.
- Maximum width is about 420px.
- Fields, in this order. Empty fields are omitted.
  - Header: `07 · Act 1 · Beat 1.2` with a "Fast run: keep/skip" chip.
  - **What it is**
  - **Tell:** why you're on it now.
  - **Say:** the talk track, quoted **verbatim** from the script.
  - **Head of Fraud:** why it matters to them.
  - **CIO:** why it matters to them.
  - **Show:** what to click or type.
  - **Leave the app:** bridge stops only. What to open (private window, AI Gateway logs, GitHub PR, Vercel rollback).
  - **Craft:** the demo technique at work, such as Tell-Show-Tell, last thing first, or raising a gap before they do. This line is for the hiring panel.
  - **Watch out:** a gap or a do-not-claim from the script's gaps table.

**Route legend**
- A small fixed pill at the bottom left, shown only while the mode is on.
- It reads, for example: "X-ray · stops 8–10 here · next 11 → /governance". The next stop is a link.
- It lets the SE walk the whole route.

## Editable content: `content/` (the owner edits it, not code)

Grant must be able to change and format the **intro deck text** and **every x-ray card**
without asking an agent. **No user-facing text for these two areas may stay in `.tsx` or `.ts`
files.**

**Where the files live**
- `content/intro/`: one file per slide.
  - `01-situation.md`
  - `02-tension.md`
  - `03-thesis.md`
  - `04-see.md`
  - `05-tiers.md`
  - `06-start.md`
- `content/intro/04-see/`: the four cards, one file each.
  - `01-story.md`
  - `02-ask.md`
  - `03-gov.md`
  - `04-pr.md`
- `content/xray/`: one file per stop, e.g. `07-start.md`.
  - The **filename's number prefix is the stop's order** (`n`). The number is not stored anywhere else.

**File format** (no new npm dependency)
- **Frontmatter:**
  - It opens and closes with a `---` line.
  - It holds flat `key: value` lines only, with no nesting.
  - It carries the short fields: `kicker`, `title`, `href`, `id`, `act`, `beat`, `route`, `fast`.
  - Parse it by hand in a new `lib/content.ts`.
- **Body:**
  - It is markdown split into sections by `## Heading` lines. For x-ray stops the sections are `## What`, `## Tell`, `## Say` and so on.
  - Render each section with the existing `react-markdown` + `remark-gfm`.
  - Bold, italics, links and lists work. Short fields render as inline markdown.

**Validation**
- `lib/content.ts` validates every file against a small schema in code: required keys, known section names, `fast` is `keep`/`skip`, and `route` is a real route.
- It throws with the **file path and the field name** in the message.
- A bad edit therefore fails `npm run build` and CI. It never reaches the live site.

**Reading the files**
- Server components read the files with `fs`, cached per process.
- `app/layout.tsx` loads the x-ray stops and passes them as props to the client `XrayProvider`.
- `app/intro/page.tsx` loads the slides.
- Add `./content/**/*.md` to `outputFileTracingIncludes` for every route. Use a catch-all key if the installed Next supports one; check the docs in `node_modules`.
- Confirm the files are traced by inspecting `.next/server/app/**/*.nft.json` after a build. This is the same class of trap as `libduckdb.so`.

**What stays in code**
- `DEMO_PR_URL` and `INTRO_FIGS` (the `46` / "merchants hold 11%", checked by `check_story_figures.py`) stay in code.
- Numbers computed from data stay computed.
- Extend `pipeline/check_story_figures.py` to also scan `content/intro/**/*.md`, so an edited figure must still trace to the data.

**`content/README.md`**
- A plain guide for Grant, written to his preferences: short, concrete, one worked example. It covers:
  - which file drives which slide or stop;
  - the field list;
  - what formatting works;
  - how to add, remove or reorder a stop (rename the number prefixes; the check enforces 1..N with no gaps);
  - how to preview: `npm run dev`, then save and refresh. The page re-reads the files on each request in dev.
  - how to ship: commit, push or open a PR, and the preview builds with the checks.

**Migration**
- Move every string in `lib/introCopy.ts` `INTRO` into `content/intro/`, **word for word**. The intro must render identically.
- Delete `INTRO` from `introCopy.ts`; keep `DEMO_PR_URL`.
- Compare the intro screenshots before and after the migration. **Before touching any code**,
  run `demo_screens.mjs` once and keep copies of the intro PNGs outside `docs/demo/fallback/`.

## X-ray stop content (`content/xray/*.md`)

- Each stop has these fields:
  - **Frontmatter:** `id`, `act`, `beat`, `route`, `fast`.
  - **Body sections:**
    - `## What`
    - `## Tell`
    - `## Say`
    - `## Head of Fraud` (optional)
    - `## CIO` (optional)
    - `## Show` (optional)
    - `## Leave the app` (optional)
    - `## Craft` (optional)
    - `## Watch out` (optional)
- **Source rule:**
  - Write everything from `docs/demo/demo-script.md`.
  - Quote "Say" lines verbatim.
  - Every Vercel or APRA claim must already be in the script, `vercel-positioning.md` or `governance-research.md`.
  - Don't add new claims.
  - "Craft" lines describe technique only and make no product claims.

Stop list, in script order. The Sonnet session finalises the wording and the exact anchors.

| n | Act · beat | Route | Anchor (element gets `data-xray`) | Kind |
|---|---|---|---|---|
| 1 | 0 · situation | /intro | slide 1 `section[data-slide]` | in-app |
| 2 | 0 · tension (APRA line) | /intro | slide 2 | in-app |
| 3 | 0 · thesis | /intro | slide 3 | in-app |
| 4 | 0 · cards 01–02 → Head of Fraud | /intro | slide 4, cards 01–02 | in-app |
| 5 | 0 · cards 03–04 → CIO | /intro | slide 4, cards 03–04 | in-app |
| 6 | 0 · three tiers | /intro | slide 5 | in-app |
| 7 | 0 · Start the demo | /intro | Start button | in-app |
| 8 | 1.1 · KPI cards | /story | KPI `Figure` row | in-app |
| 9 | 1.1 · 46-merchant chapter | /story | that chapter's `data-chapter` section | in-app |
| 10 | 1.2 · Ask button | /story | `AskButton` in that chapter | in-app |
| 11 | 1.2 · evidence card (SQL, rows, read-only) | Ask panel | evidence card | in-app (appears after a question) |
| 12 | 1.2 · "Delete all the fraud rows" → two locks | Ask panel | input box | in-app |
| 13 | 1 · Vercel underneath | /story | page header | in-app |
| 14 | 2.1 · who can see it (login wall, Passport) | /governance | Access `Figure` | **bridge**: private window |
| 15 | 2.2 · where it runs (`syd1`) | /governance | Deployment `Figure` | in-app |
| 16 | 2.3 · what AI it calls (allowlist, no training, no key) | /governance | AI usage `Figure` | **bridge**: Gateway settings |
| 17 | 2.4 · who's watching (per-answer readout) | Ask panel | model · time · cost readout | **bridge**: Gateway logs |
| 18 | 3 · APRA change-control quote + 3.1 propose | /governance | Change control `Figure` | **bridge**: GitHub PR |
| 19 | 3.2 · preview badge | shell | sidebar deployment badge | in-app |
| 20 | 3.3 · the checks | /governance | Change control `Figure` (second badge) | **bridge**: PR checks |
| 21 | 3.4 · ship and undo | /governance | Change control `Figure` (third badge) | **bridge**: Vercel rollback |
| 22 | 4.1 · "I tried to break it" | Ask panel | panel header | in-app |
| 23 | 4.2 · SCOPE CHECK card | Ask panel | scope-check card | in-app (after a blocked question) |
| 24 | 4.3 · why each of you should care | Ask panel | "scope check passed" footer | in-app |
| 25 | 4.4 · one integration, any model | Ask panel | model select; falls back to the readout when the switch is off | in-app |
| 26 | 5 · Connect (placeholder) | /governance | Data `Figure` | in-app |
| 27 | Close · tiers | /governance | `TierTable` figure | in-app |

**Out of scope:** `/findings`, `/patterns`, `/model`, `/explorer` and `/brief`. The script never
discusses them, so any markers there would need new claims. If wanted, they can come later as
unnumbered "If asked" stops.

## Files

- **New:**
  - `components/xray/XrayProvider.tsx` (context, hotkey, URL seed, TooltipProvider)
  - `components/xray/XrayLayer.tsx` (scan, position, badges, cards)
  - `components/xray/XrayLegend.tsx`
  - `lib/content.ts` (loader, flat-frontmatter parser, schema validation)
  - `content/intro/**`, `content/xray/*.md`, `content/README.md`
  - `components/Markdown.tsx` (shared block + inline markdown renderer)
  - `pipeline/check_xray.mts`
- **Edit:**
  - `app/layout.tsx` (mount the provider, pass stops from `content/xray/`)
  - `app/intro/page.tsx` (render from `content/intro/`)
  - `lib/introCopy.ts` (remove `INTRO`, keep `DEMO_PR_URL`)
  - `next.config.ts` (trace `./content/**/*.md`)
  - `pipeline/check_story_figures.py` (also scan `content/intro/`)
  - `components/shell/AppShell.tsx` (sidebar switch)
  - `app/globals.css` (`--xray` token, glow keyframes)
  - `data-xray` attributes in:
    - `app/intro/page.tsx`
    - `app/story/page.tsx`
    - `app/governance/page.tsx`
    - the Ask components under `components/ask/` (evidence card, scope-check card, input, readout, model select, header)
    - the deployment badge
  - Pass `data-xray` through the shared `Figure` (`components/Figure.tsx`) as a prop rather than wrapping it.
- **Before writing code:** read `node_modules/next/dist/docs/` as CLAUDE.md requires, and check the Radix tooltip API in `node_modules`.

## Checks

- **`pipeline/check_xray.mts`:**
  - Every stop file in `content/xray/` has at least one `data-xray` anchor in `app/` or `components/`.
  - Every anchor id exists as a stop file, and every content file passes `lib/content.ts` validation.
  - Filename prefixes run 1..N with no gaps or duplicates.
- **CI:** add it to `.github/workflows/checks.yml` as a seventh job, **"X-ray stops match the script"**. Pin the action SHAs like the existing jobs. This needs no secrets.
- **`pipeline/browser_smoke.mjs`:** repeat the `/explorer` (1440, 1920) and `/intro` (1440) overflow checks with `?xray=1`. Also assert that at least one badge renders and that hovering it shows the card.
- **`pipeline/demo_screens.mjs`:** add x-ray beats with the mode on and one card hovered: intro slide 3, story KPIs, governance, and the Ask panel after the blocked question.

## Verification

1. Run `npm run build`. Then break one content file on purpose (drop `title:` from `content/intro/03-thesis.md`) and confirm the build fails, naming that file and field. Restore it.
   - Run `npm run dev`. Edit one x-ray `## Say` section and one intro title, refresh, and confirm both changes show without a restart. Revert the edits.
   - Confirm `content/` appears in `.next/server/app/**/*.nft.json` for `/intro` and for at least one shell route.
2. Run `node --no-warnings pipeline/check_xray.mts`.
3. Start a server: `ASK_ZDR=0 npm run start -- -p 3000`.
4. Run `node pipeline/browser_smoke.mjs http://localhost:3000` and `node pipeline/demo_screens.mjs http://localhost:3000`.
5. Look at every new x-ray screenshot. Check that:
   - badges sit on the right element;
   - cards don't clip;
   - typing "x" in the Ask box doesn't toggle the mode;
   - x-ray off leaves the existing screenshots unchanged.
6. Kill the server on :3000.
7. Run the existing checks: `check_parity.py`, `check_story_figures.py`, and `test_guard.mts` / `test_ask_headline.mts` / `test_scope_gate.mts`.
8. Commit with explicit paths. Do **not** push or deploy. Grant runs the production deploy.
9. Write `docs/handoffs/xray-mode-report.md`, of no more than 400 words. It covers the stops built, any anchors that moved, screenshots looked at, check output and commits. Its last line is exactly `<!-- END OF REPORT -->`.

## Owner follow-ups (not agent work)

- **Stop 25 (model switch):** this needs `ASK_DEMO_MODEL_SWITCH=1` on **production** (open item 2). Until then the marker falls back to the readout.
- **Branch protection:** add the new CI job to the required checks when branch protection is set up.
