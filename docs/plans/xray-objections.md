# X-ray objections: research, then objection markers

## Context

X-ray mode (`a819891`) puts numbered coaching cards on every element the demo script discusses.
Grant wants to add **objections**: what the CIO or Head of Fraud is likely to push back with, where
in the demo it comes up, and how to answer it. This serves both audiences. An SE learns to handle
pushback. A hiring panel sees that Grant expects it.

Two parts, **in this order**:
1. **Research** objections, including why companies choose a competitor over Vercel. Write it
   up with sources.
2. **Build** objection markers on the existing x-ray layer, with the content as editable markdown.

## Part 1: Research → `docs/demo/objections-research.md`

Use WebSearch and WebFetch. Search for:

- **Competitors and why buyers choose them over Vercel.** Look for each reason with a source:
  cost at scale (bandwidth and function pricing), Next.js lock-in, existing cloud agreements, self-hosting,
  data residency and compliance, enterprise support. Platforms to check:
  - AWS Amplify, AWS App Runner
  - Azure Static Web Apps, Azure App Service
  - Netlify
  - Cloudflare Workers/Pages
  - Render
  - Railway
  - Internal platforms such as OpenShift and Kubernetes
  - Data-adjacent app platforms: Streamlit in Snowflake, Databricks Apps
  - Low-code internal-tool platforms: Power Apps, Retool
- **Australian bank objections to cloud and AI platforms.** Look for:
  - CPS 230 offshoring and material service providers
  - CPS 234
  - Data sovereignty
  - Where model inference runs
  - Concentration risk
- **Shadow IT and citizen-developer objections from IT and risk.** Look for:
  - Who supports the app
  - Who owns incidents
  - "We already have a platform"
- **AI-in-the-tool objections.** Look for:
  - Hallucination
  - Whether a checker model can be fooled
  - Provider retention and training
  - Explainability to an auditor

Format of the research file:

- One entry per claim.
- Each entry has the claim, a short quote, the source URL, the publisher, the date, and the date you accessed it.
- Separate facts (pricing pages, docs) from opinion (blogs, forum threads, analyst notes).
- Record the date of each pricing figure.
- Mark anything you couldn't verify as unverified.

**Do not edit** `vercel-positioning.md` or `governance-research.md`. Add the new file's name to
the sources line at the top of `docs/demo/demo-script.md`.

**Honesty rule.** Where a competitor is the better fit for a case, say so, and write the answer
as how to handle that case. Don't write it as a rebuttal. One example is a bank that is all-in on Azure with an
existing enterprise agreement. The script's "say it before they do" posture applies.

## Part 2: Objection markers

**Content files**
- One file per objection in `content/objections/<slug>.md`. Aim for 14–20 objections across five themes:
  - `sovereignty`
  - `cost-lockin`
  - `ai-risk`
  - `shadow-it`
  - `competitor`
- Filenames are not numbered, because objections have no order.
- Frontmatter, flat `key: value`:
  - `id`
  - `title`: the objection in the client's words, short
  - `who`: `CIO` | `Head of Fraud` | `Either`
  - `theme`: one of the five above
  - `anchor`: the `id` of an existing x-ray stop, e.g. `ai-called`. The marker sits on that stop's element. **Add no new `data-xray` attributes.**
- Sections:
  - `## They say`: required. How it sounds in the room.
  - `## Why they ask`: required. The worry underneath.
  - `## Answer`: required. The talk track: acknowledge, answer, then point to proof.
  - `## Show`: optional. What to point at in the app.
  - `## Don't say`: optional.
  - `## Sources`: required. Each line names a doc and a section, or a URL from the research file.
- **Source rule.** Every factual claim in an `## Answer` traces to one of these files:
  - `vercel-positioning.md`
  - `governance-research.md`
  - `objections-research.md`
  - `demo-script.md`

  Don't add new Vercel or APRA claims beyond these files, and keep the script's "Do not claim" list.

**Loader** (extend `lib/content.ts` and `lib/xrayTypes.ts`)
- Add `loadObjections()` with the same validation style as the stops:
  - errors name the file and the field;
  - only the six section names are allowed;
  - `who` and `theme` must be valid values;
  - `anchor` must match an existing stop id.
- Include it in `validateAllContent()` so a bad file fails the build.
- Pass the objections to `XrayProvider` from `app/layout.tsx`, alongside the stops.

**Markers** (`components/xray/XrayLayer.tsx`)
- Objection markers are a second style:
  - an amber `!` on a rounded square (new `--xray-objection` token in `globals.css`);
  - drawn after the stop badges on the same element, in the same row;
  - no glow pulse, so the numbered route stays dominant.
- Hover card, using the same tooltip and behaviour as the stop cards:
  - header: `Objection · CIO · sovereignty`;
  - the title;
  - then the sections in the order above;
  - Sources in small muted text.
- If more than one objection anchors to the same stop, show one `!` badge with a count. Its card lists each objection, separated by dividers.
- **Legend.**
  - Add the objection count for the current page, e.g. "· 3 objections".
  - Add a small "Objections" on/off toggle, on by default.
  - Keep the toggle state in the provider. It resets on reload, like x-ray itself.

**`content/README.md`.** Add a short "Objections" section: the fields, the themes, how to add one,
and how `anchor` works (copy a stop's `id` from its frontmatter).

## Checks

- `pipeline/check_xray.mts`: also validate every objection file, and check that every `anchor` resolves to a stop.
- `pipeline/browser_smoke.mjs`: on `/governance` with `?xray=1`:
  - at least one objection badge renders;
  - hovering it shows the "They say" text;
  - there is no horizontal overflow.
- `pipeline/demo_screens.mjs`: add one beat with an objection card hovered on `/governance`.

## Verification

1. Run `npm run build`. Then remove `## Answer` from one objection file and confirm the build fails, naming that file. Restore it.
2. Run `node --no-warnings pipeline/check_xray.mts`.
3. Start a server: `ASK_ZDR=0 npm run start -- -p 3000`.
4. Run `browser_smoke.mjs` and `demo_screens.mjs` against it, then look at the new screenshot.
5. Check that the stop badges are unchanged and that the objection cards don't clip at 1440px. Kill the server.
6. Run the existing checks: parity, figures, guard, headline, scope gate.
7. Before committing, run `git status`. Make sure `content/objections/*.md` are tracked and not hidden by `.vercelignore`. The `!/content/**/*.md` rule should cover them; confirm it does.
8. Commit with explicit paths. **Do not push.** A push to `main` deploys production automatically.
9. Write `docs/handoffs/xray-objections-report.md` in no more than 400 words. Include:
   - the research coverage, with the number of sources per theme;
   - the list of objections, with their anchors;
   - anything unverified;
   - check output;
   - commits.

   Its last line is exactly `<!-- END OF REPORT -->`.
