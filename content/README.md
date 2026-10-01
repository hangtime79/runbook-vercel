# Editing the intro and the x-ray cards

Every word on the `/intro` deck and every x-ray card lives in a markdown file in this folder. You edit
the file, save, and refresh. No agent needed.

## Which file drives what

| Folder / file | What it drives |
|---|---|
| `intro/01-situation.md` … `intro/06-start.md` | One slide each, in order |
| `intro/04-see/01-story.md` … `04-pr.md` | The four cards on slide 4 |
| `xray/01-situation.md` … `xray/27-close-tiers.md` | One x-ray marker and its hover card each |
| `story/kpis.md`, `story/<chapter>.md` | The quiet "On Vercel" line under the KPI row and under each chapter heading on `/story` |
| `objections/<slug>.md` | One amber `!` objection marker and its hover card each |

The number at the front of an x-ray filename **is** the marker number. `07-start.md` is marker 7.

## Intro files

Each file is a short block of `key: value` lines between two `---` lines. Nothing else.

```
---
kicker: The thesis
title: The CIO owns the platform. The fraud team owns the problem. Both are responsible for the apps.
sub: Every app, however it was built, lands on the same rails: identity, review, logging, rollback.
---
```

| File | Fields |
|---|---|
| `01-situation.md` | `kicker`, `title`, `closer`, `label_fraud`, `label_rate` |
| `02-tension.md` | `kicker`, `title`, `fraud_role`, `fraud_line`, `cio_role`, `cio_line`, `apra_label`, `apra_quote`, `apra_cite` |
| `03-thesis.md` | `kicker`, `title`, `sub` |
| `04-see.md` | `kicker`, `title`, `vercel_label` (the "On Vercel" label) |
| `05-tiers.md` | `kicker`, `title`, `sub` |
| `06-start.md` | `title`, `button`, `footer` |
| `04-see/*.md` (cards) | `title`, `text`, `vercel` (the On Vercel line), `href` (`/story`, `/ask`, `/governance`, or `PR` for the pull request) |

Every field is required, and a misspelt field name is an error. The fraud count, the fraud rate and the
"46 merchants hold 11%" figure are not here: the first two are read live from the data and the third
sits in `lib/copy.ts`.

## X-ray files

A small block of `key: value` lines, then sections that start with `## Heading`.

```
---
id: thesis
title: The thesis
act: Act 0
beat: Step 3
route: /intro
fast: keep
---

## What
Slide 3: the thesis in one sentence.

## Tell
Pause on it. Say it once, slowly.

## Say
You don't have to choose between the fraud team's speed and IT's control.
```

| Field | Meaning |
|---|---|
| `id` | Short name, lowercase with dashes. The app marks an element with this name |
| `title` | Bold line at the top of the card |
| `act`, `beat` | The label in the card header, for example `Act 1` and `Beat 1.2` |
| `route` | The page the stop lives on: `/intro`, `/story`, `/governance`, and so on. Used by the route legend |
| `fast` | `keep` or `skip`: is this stop in the 5-minute run? |

Sections, in the order the card shows them. **What**, **Tell** and **On Vercel** are required; the rest are
optional, and a section you leave out does not show.

`## What` · `## Tell` · `## On Vercel` · `## Say` · `## Head of Fraud` · `## CIO` · `## Show` · `## Leave the app` · `## Craft` · `## Watch out`

**On Vercel** says what the platform does behind this element and why it matters to a bank, in one or two
sentences, with its source at the end. Every claim traces to `docs/demo/vercel-positioning.md`,
`governance-research.md` or `objections-research.md`. On a bridge stop it names the Vercel product on the other side.

A stop with a `## Leave the app` section is a bridge stop: the demo leaves the app there.
Quote **Say** lines word for word from `docs/demo/demo-script.md`, and keep new Vercel or APRA claims
out of every section unless the script already makes them.

### Optional front fields: the Ask panel and ghost stops

| Field | Meaning |
|---|---|
| `panel: yes` | The stop's element lives in the Ask panel, so going to it opens the panel (closed by default under 1240px) |
| `stand_in` | A ghost stop: the id of the element to sit on until the stop's own element exists. Another stop's id, or an id written as `data-xray-standin="..."` on any element |
| `appears_after` | The stop number whose action makes the real element appear. Must be lower than this stop's number. Goes with `stand_in` |
| `appears_hint` | Optional. What to do first. The ghost card opens with "Appears after stop N: *hint*." The default hint is "click Ask first" |

A ghost badge has a dashed ring and half opacity. When the real element shows up, the badge moves there and turns solid.

## Moving around

The pill at the bottom has **‹** and **›** buttons, and the **[** and **]** keys do the same (not while typing in a
box; the arrow keys belong to the intro deck). They go to the stop: change page, open the Ask panel if needed,
scroll to the element, and pin its card open. A pinned card closes on Escape, on a click elsewhere, or when you
go to another stop. Clicking a badge pins its card too.

## Story page lines

`story/kpis.md` and one file per chapter (`merchants.md`, `amount.md`, `velocity.md`, `subsector.md`,
`signature.md`, `age.md`, `travel.md`) each hold one `## On Vercel` section and nothing else, no frontmatter.
The line shows under the KPI row and under that chapter's heading. The file names are fixed; the words are yours.

## Objections

An objection is something the CIO or Head of Fraud is likely to push back with, where it comes up in the
demo, and how to answer it. Each file in `objections/` becomes an amber **!** marker on a stop's element.
Filenames have no number prefix (`bill-at-scale.md`): objections have no order.

```
---
id: bill-at-scale
title: Usage-based pricing will blow up our budget
who: CIO
theme: cost-lockin
anchor: underneath
---

## They say
How it sounds in the room.
```

| Field | Meaning |
|---|---|
| `id` | Short name, lowercase with dashes, unique |
| `title` | The objection in the client's words, short |
| `who` | `CIO`, `Head of Fraud` or `Either` |
| `theme` | `sovereignty`, `cost-lockin`, `ai-risk`, `shadow-it` or `competitor` |
| `anchor` | The `id` of an existing x-ray stop. The marker sits on that stop's element |

Sections, in the order the card shows them. **They say**, **Why they ask**, **Answer** and **Sources** are
required; **Show** and **Don't say** are optional. No other section names are allowed.

`## They say` · `## Why they ask` · `## Answer` · `## Show` · `## Don't say` · `## Sources`

**How `anchor` works.** Open the stop file in `xray/` that you want the objection to appear on and copy its
`id` line (for example `id: ai-called`). Nothing is added to the app: the marker sits next to that stop's
element. Several objections on one stop share one badge with a count (`!2`), and its card lists each one.
Pick a stop whose element is always on the page (not the Evidence card, which exists only after a question).

**Sources rule.** Every factual claim in an Answer traces to `docs/demo/vercel-positioning.md`,
`governance-research.md`, `objections-research.md` or `demo-script.md`. Each `## Sources` line names a
document and a section, or an `R-xx` entry from the research file. Keep the script's "Do not claim" list.

**To add one.** Copy an existing file, change the fields, pick an `anchor`, save, and refresh. The legend pill
shows the count for the page and a switch to hide the markers.

## Formatting that works

`**bold**`, `*italic*`, `` `code` ``, `[link text](https://example.com)`. In the x-ray sections you can
also use bullet lists (`- item`), numbered lists (`1. item`) and blank lines between paragraphs. Intro
fields are one line each, so only the inline marks apply there. Don't put a link inside an intro card:
the whole card is already a link.

## Add, remove or reorder an x-ray stop

1. Rename the files so the number prefixes run `01`, `02`, `03` … with no gaps and no repeats.
2. A new stop also needs something on the page to mark. Ask an agent to add `data-xray="your-id"` to
   that element. A stop with no element, or an element with no stop file, fails `node --no-warnings pipeline/check_xray.mts`.
3. Removing a stop: delete its file, renumber the rest, and remove its `data-xray` from the page.

## Preview

```
npm run dev
```

Open the page, edit a file, save, refresh. The page re-reads the files on every request while you
develop, so you don't restart anything. Turn the x-ray on with the **X** key, the switch at the bottom
of the sidebar, or `?xray=1` on the address.

## What happens when you get it wrong

The build checks every file. A missing field, an unknown section, a bad `fast` value, a route that
doesn't exist, or a numbering gap stops `npm run build` and the CI checks with a message like:

```
content error in content/intro/03-thesis.md (field "title"): missing required field "title"
```

A mistake never reaches the live site.

## Ship

Commit and push, or open a pull request. The preview builds and the checks run on it. The check
**Copy figures trace to data** also reads `content/intro/`, so a number you type into the intro must
still match the data.
