# X-ray round 2: report

## Ghost stops and their stand-ins

Found by loading each route fresh with `?xray=1`. `/intro` has none. `/story` has 11. `/governance` has 17, 23, 24, 25.

| Stop | Stand-in | Appears after | Hint on the card |
|---|---|---|---|
| 11 evidence | Ask box (`delete-refused`) | stop 10 | click Ask first |
| 17 watching | Ask box | stop 10 | click Ask first |
| 23 scope card | Ask box | stop 12 | ask the blocked question first |
| 24 why-care | Ask box | stop 10 | click Ask first |
| 25 model-switch | Ask panel header (`red-team`) | stop 10 | click Ask first |

Two optional fields beyond the plan: `panel: yes` (stop lives in the Ask panel, so go-to opens it; set on 11, 12, 17, 22 to 25) and `appears_hint`. Both are in `content/README.md`.

## What changed

- **Go-to:** `‹ 11 / 27 · title ›` in the legend, plus `[` and `]`. It changes page, opens the panel, scrolls, and pins the card. Pinned cards close on Escape or an outside click. The legend now sits above the cards (z-80): a pinned card was blocking its own `›` button.
- **On Vercel:** required section on all 27 stops, with sources. Bridge stops name the Vercel product on the other side.
- **Fixed:** stop 12's pre-gate line. Stop 23's category is now `code_request`.
- **Intro:** cards lead with the On Vercel line. **`/story`:** `content/story/*.md` (8 files) render under the KPI row and each chapter heading.

## Checks

- Build fails, naming the file, for a missing `## On Vercel` and for a bad `stand_in`. Both restored.
- `check_xray.mts`, `check_story_figures.py` (102 figures traced), parity, guard, headline, scope gate: all PASS.
- `browser_smoke.mjs`: SMOKE PASSED. `]` seven times from `/intro?xray=1` lands on `/story` with stop 8's card open and in view. Stop 11 shows as a ghost with the "Appears after stop 10" line, turns solid after a question, and `[` returns to stop 10. The legend fits at 1440px with the panel open.
- `demo_screens.mjs`: 0 console errors; ghost, pinned-card and `/story` On Vercel screenshots checked by eye.
- **Not browser-tested:** that Escape leaves the Ask panel open. The handler consumes Escape while a card is pinned; I confirmed the logic, not the panel.

## Commits (not pushed)

- `9f5a002`, `a56c34d`, `c91df89`: demo script (three commits)
- `3d9e437`: navigation, ghost stops, On Vercel on every card
- `fe17860`: intro deck and `/story`

## Appendix: demo script, before → after

**9f5a002 · Act 0, step 4**
- Before: "Each card has an **On Vercel** line: read the one that matches the person you're looking at."
- After: "Each card leads with an **On Vercel** line, the platform feature behind it: read the one that matches the person you're looking at."

**9f5a002 · Act 1 (rewritten)**
- Added: "Each beat runs *what they see* → *what Vercel does* → *why a bank cares*. The data is the proof; the platform line is the point."
- Beat 1.1 before: "Scroll one chapter (the 46-merchant cluster)." After: "Don't read the chapter; say one sentence on it."
- Beat 1.1 before: "Every number is read from the data when the page loads, not pasted into a slide." After, platform line to the CIO: "Every number is read from the data when the page loads, by a function running in Sydney next to it. And when nobody is looking, it costs nothing: Vercel bills the CPU only while code runs, and nothing between requests."
- Beat 1.2, new platform line to the CIO: "The model is one string on one AI Gateway integration: no key stored in this project, and any approved model behind it. While the function waits on the model, it isn't billed CPU for the wait."
- Removed: the "Vercel underneath (one line each, don't lecture)" paragraph. Its lines now sit in beats 1.1 and 1.2.

**9f5a002 · Beat 2.2**
- After adds: "For your CPS 230 file, that is where the code runs; the data-processing terms are a separate conversation."

**a56c34d · Beat 1.2, delete refusal**
- Before: the model declines ("I can't delete or modify data."); "That's the AI behaving. You shouldn't have to rely on that…"; a separate "Once the scope gate is built" paragraph.
- After: the SCOPE CHECK card appears (*write_request*). "Blocked before the AI even saw it. I'll show you how in a few minutes. But you shouldn't have to rely on any model behaving, so there are two locks that don't…"

**a56c34d · Beat 4.2**
- Before: *out of scope · person_lookup · typesafe-ai/jev*. After: *out of scope · code_request · typesafe-ai/jev*.

**c91df89 · Act 0, step 1**
- Before: "This app is one of those tools." After: "This app is one of those tools, and tools like it are apps that need a home."

**c91df89 · Act 0, step 2**
- Before: "The tension. Look at each of them in turn…" After: "The tension. 'Speed against control is a platform problem.' Look at each of them in turn…"

<!-- END OF REPORT -->
