# Handoff: Runbook Fraud Dashboard — Geist Dark Redesign

Target repo: `hangtime79/runbook-vercel` (branch `main`) — Next.js 16 App Router, React 19, AI SDK 7 (`@ai-sdk/react` `useChat`), Recharts 3, DuckDB.

## Overview
A redesign of the five-view fraud dashboard plus "Ask the data" as a first-class surface. Goals, from stakeholder feedback:
- Headline numbers up front (fraud rate, fraud count, AUC).
- Replace markdown walls with a **scroll-driven story** of the 7 findings.
- Charts carry **annotations** (baseline line, highlighted marks, one-line "what to notice").
- **Scannable explorer** (filters, flags, inline bars, threshold marker).
- Ask-the-data answers read as **answer + evidence**, not raw chat.
- Audience: Vercel stakeholders watching a demo, and fraud investigators using it daily.

## About the design files
`Redesign B - Geist Dark.dc.html` is a **design reference built in HTML** — an interactive prototype showing intended look and behaviour, not production code. Recreate it in the existing Next.js app using **Tailwind CSS, shadcn/ui, Geist (via `geist` npm package / `next/font`), Recharts and the AI SDK**. Keep every invariant in `SPEC.md` (read-only SQL, SQL always shown, no client secrets, AI Gateway, parity numbers).

Open the `.dc.html` in a browser to interact. `fraud-data.js` holds the numbers used (lifted verbatim from `pipeline/parity_reference.json`, `data/shap_importance.json`, `data/docs/*.md`) — in the real app these come from the existing `lib/queries.ts` / `lib/docs.ts`. `reference/Current UI.dc.html` is a recreation of today's UI for before/after comparison.

## Fidelity
**High-fidelity.** Final colors, type, spacing and interactions. Two exceptions:
- Explorer rows in the prototype are **illustrative** (seeded random). Use `explorerRows()`; the `score` column needs a precomputed model score exported by `pipeline/export_web_data.py` (new — see State/Data).
- Ask-the-data answers in the prototype are **canned** (8 questions). Wire to the existing `/api/ask` route + `useChat`.

---

## App shell (`app/layout.tsx`)
Full-viewport flex row, `height:100vh; overflow:hidden`, bg `#0a0a0a`, text `#ededed`, `color-scheme: dark`, thin scrollbars `scrollbar-color:#2e2e2e transparent`.

| Column | Width | Notes |
|---|---|---|
| Sidebar | `212px` fixed, `border-right:1px solid #262626`, padding `22px 0 18px` | nav |
| Main | `flex:1`, own vertical scroll (`overflow-y:auto`) | page content |
| Ask panel | `380px` open / `44px` collapsed / `flex:1` on the Ask route; `border-left:1px solid #262626`, bg `#0f0f0f` | persistent across routes |

Default the panel to collapsed when `window.innerWidth < 1240`.

### Sidebar
- Brand block (padding `0 20px 22px`, gap 2): row "● Runbook" (8px red dot `#e5484d`, 12px/500 `#a1a1a1`); title "Card Fraud Analysis" Geist 18px/600, letter-spacing −0.02em; sub "Jan – Dec 2017 · 254,224 labeled" 12px, text at 58% opacity.
- Nav items (use `next/link`): grid `28px 1fr`, padding `9px 20px`, `border-left:2px solid` (active `#e5484d`, else transparent), active bg `rgba(229,72,77,.05)`, hover bg `rgba(229,72,77,.08)`. Number in Geist Mono 11px at 50% (`01`–`06`); label Geist 14px/500.
  Items: `/` Story · `/findings` Key findings · `/patterns` Patterns · `/model` Model · `/explorer` Explorer · `/ask` Ask the data.
- Footer (margin-top auto, `border-top:1px solid #262626`, padding `16px 20px 0`, 11px, 55% text): kicker "PRODUCED BY THE METHOD" (10px, tracking .1em) · "Playbook v3.2 · 10 phases · 6 agents" · "artifacts/ → data/ · read via DuckDB" · "Next.js · AI SDK · AI Gateway on Vercel". This is the only runbook/method surface — keep it subtle.

### Shared page header (all routes except Story)
Padding `40px 40px 64px`, max-width 1160, column gap 32–40. Kicker 11px uppercase tracking .12em `#ff6b6f`; H1 Geist 36px/600, line-height 1.1, tracking −0.03em; lede 15px at 75%, max-width 680.

### Panel / card surface ("Card")
`border:1px solid #262626; border-radius:12px; background:#0f0f0f`. Padding 14–22px. Map to shadcn `Card`.

---

## Screens

### 01 Story (`/`) — replaces Narrative
1. **Sticky chapter rail** (top of main scroll, z 5, bg `#0a0a0a` at 92% + `backdrop-filter:blur(6px)`, bottom border, padding `10px 40px`): label "SEVEN FINDINGS" + 7 equal segments. Each: 3px bar `#e5484d` + mono 10px "0N Short". Segments ≤ active chapter at opacity 1, others 0.28. Click → smooth-scroll to chapter (offset −50px).
2. **Hero** (padding `44px 40px 36px`, max 1080): kicker "Analytical brief · Fraud Ops & Risk Strategy"; H1 44px/600, lh 1.08, tracking −0.035em, max 880: "One-third of all fraud sits in three places — and one control halves the risk."; lede 17px at 80%, max 720.
   **KPI grid** `repeat(auto-fit,minmax(180px,1fr))` gap 20, four Cards (padding `16px 18px`): label 10px uppercase .12em 58% · value 38px/600 tracking −0.035em · caption 12px 60%.
   - Fraud rate **9.47%** (value in `#ff8a8d`) · "of labeled transactions"
   - Confirmed fraud **24,080** · "of 254,224 labeled · 72,781 pending"
   - Holdout AUC **0.764** · "XGBoost · 5-fold 0.759 ± 0.003"
   - Signature effect **2.3×** · "protection when signed"
3. **Seven chapters** (`section[data-chapter=i]`, padding `44px 40px`, top border, grid `repeat(auto-fit,minmax(320px,1fr))` gap 36, max 1160).
   Left column: "Finding 0N" mono 12px `#ff6b6f` + owner pill; H2 28px/600 lh 1.15 tracking −0.03em; big stat 56px/600 `#ff8a8d` + stat label 14px 70% (max 220); a 2-col grid `92px 1fr` with "WHY" / "DO THIS" labels (10px uppercase 55%) and 14px copy (action at 500 weight); secondary button `Ask: "<question>"` that sends the question to the Ask panel (opens it).
   Right column: Card figure — header row (chart title / "fraud rate", 11px uppercase 58%), horizontal bar rows (grid `minmax(0,132px) 1fr 56px`, gap 10, 13px): track 16px high `rgba(237,237,237,.05)`, fill `#e5484d` at opacity **1 for highlighted / 0.32 for others**, dashed 1px `#ededed` vertical **baseline marker** at 9.47% of the axis max, value right-aligned tabular (600 weight when highlighted). Caption 12px 65% with a dashed-line legend swatch.
   Chapter content (copy exactly from the prototype `CHAPTERS` array): Merchants (Investigations) · Micro $2–$5 (Rules Engine) · Velocity (Rules Engine) · Subsectors (Fraud Ops) · Signature (Channels / POS) · Age 65+ (Risk Strategy) · Travel flag (Rules Engine). Axis max per chart: 0.85 / 0.5 / 0.9 / 0.15 / 0.12 / 0.12 / 0.12.
4. **Closer**: kicker "What the model adds", H2 "A usable risk score, capped by missing signals.", copy, buttons "Open the model" (primary: bg `#ededed`, text `#0a0a0a`, radius 8, 14px/600, padding `9px 16px`) and "All recommendations" (secondary).

Active chapter tracking: on main-scroll, active = last `[data-chapter]` whose `offsetTop − scrollTop < clientHeight × 0.45`. Use an `IntersectionObserver` in the real build.

### 02 Key findings (`/findings`)
Header kicker "Phase 5 · Pattern discovery · Pass 1 + Loop 1", H1 "Where the signal is — and what to do about it".
- Row (auto-fit minmax 340): **Variance ranking** Card — 10 rows grid `20px minmax(0,170px) 1fr 44px`: rank mono, dimension mono 12px, 12px bar (width = range/90.9), value. Ranks 6–10 at opacity 0.5. Caption about velocity step. **Typology inventory** — 5 rows grid `150px 76px 1fr`, bottom borders; "Yes" in 700 weight `#8f8f8f`/accent, others muted.
- **Recommendations** list (7 rows, grid `40px 1fr minmax(0,260px) 150px`, top borders, padding 14 0): number 28px/600 `#ff6b6f`, action 15px/500, evidence 13px 70%, owner outline pill.
- **Triggers** Card: 4 cells (auto-fit minmax 220): mono feature name, 26px/600 value, 12px caption. Values: merchant_fraud_rate 55× spread; is_micro_transaction 5.17×; velocity_above_1_per_hour 2.65×; micro × velocity **77.95%** (accent).

### 03 Patterns (`/patterns`) — Recharts
Header kicker "Live from data/golden_record.parquet". Every chart: Card, H3 24px/600, a one-line annotation (13px `#ff8a8d`, bold lead), dashed baseline at 9.47% (`ReferenceLine y={0.0947} strokeDasharray="3 3" stroke="#ededed"` with label "baseline 9.47%").
- **Hour** (`BarChart`, 200px plot): bars `#e5484d`, hours 2–6 opacity 1 else 0.32 (`<Cell>`); `ReferenceArea x1=2 x2=6` fill accent 9% labelled "OVERNIGHT WINDOW" above the plot. Y ticks 0/5/10/15/20%. Annotation: "2–6 AM runs 12.5–18.6% — about 2× baseline. Midnight itself is low (7.9%)."
- **Heatmap** hour × day: CSS grid `36px repeat(24,minmax(0,1fr))` gap 2, 24px cells, 9-step ramp `#2b1214 #3b1719 #5c1f22 #8c2a2e #c93a3f #e5484d #ff6b6f #ff8a8d #ffd1d2` indexed by `round(sqrt(t)×8)`, `t=(v−lo)/(hi−lo)`; the max cell gets a 2px `#ededed` outline. Legend 7.4% ▭ 35.1%. Annotation: "Monday 4 AM peaks at 35.1%."
- **Merchant category** (top 14, horizontal bars), ranks 2–6 (the high-risk five) highlighted; append "· n=101" for n<500. Caption about health care technology noise.
- **Amount band** (9 bands from findings Finding 2, vertical bars with value labels, `$2–$5` and `$1k+` highlighted). Needs a new query in `lib/queries.ts` (bucketed rates) — parity-check it against `findings.md`.

### 04 Model (`/model`)
Header kicker "Phase 6–7 · XGBoost · 32 features · diagnostics PASS". KPI Cards: Holdout AUC 0.764 (accent) / 5-fold CV 0.759 ±0.0032 / PR-AUC 0.329 vs 0.095 random / Operating point "50 / 17" % precision/recall @ 0.8588.
- **SHAP** Card: 15 horizontal bars (label col `minmax(0,210px)`, right-aligned; mono value 11px), top 3 opacity 1 else 0.35. Tooltip = direction text for top 5.
- **Confusion matrix** Card: 2×2 with row/col labels; TP cell bg `#2b1214`, border `#e5484d`, text `#ffd1d2`. Values 45,200 / 829 / 3,987 / 829.
- **§6.5 diagnostics**: 4 rows, PASS pill + text.

### 05 Explorer (`/explorer`)
Header kicker "features.parquet · first 500 rows", search input right (max 280). Filter pills: All · Above threshold · Confirmed fraud · Micro < $5 · Hot merchant — each with mono count; active = bg `#e5484d`, text `#0a0a0a`. Right note "Sorted by model score · threshold 0.8588 marked".
Table (shadcn `Table`, sticky header bg `#0a0a0a`, header 10px uppercase .1em 60%, cells 13px, padding `8px 12px`, row border `rgba(237,237,237,.07)`, hover `rgba(229,72,77,.07)`; rows ≥ threshold tinted `rgba(229,72,77,.05)`). Columns: Outcome (8px square dot — fraud `#ff6b6f`, legit `#2e2e2e`) · Transaction (mono) · Amount (USD, right) · Subsector · Hour (`HH:00`) · Signed (✓/—) · Merchant rate (6px bar `#c93a3f` + 3dp) · Flags (pills MICRO / VELOCITY / HOT MERCHANT where merchant_fraud_rate > 0.284) · Model score (10px bar, fill `#e5484d` if ≥ 0.8588 else `#454545`, 1px tick at 85.88%, mono value). Empty state: "No rows match. Clear the search or pick another filter."

### 06 Ask the data (`/ask` + persistent panel)
Same component in two sizes; on `/ask` it takes the main column (content max-width 760 centred) and the collapse control is hidden.
- Header: "Ask the data" 20px/600 + "Plain question → read-only SQL → answer with evidence" 12px 60%; ghost "→" collapses. Collapsed state: 44px strip with vertical text "Ask the data ←".
- Empty state: "TRY ONE" + the three `EXAMPLES` from `components/AskData.tsx` as full-width bordered buttons (hover border accent).
- **Message**: "Q1" mono 11px accent + question 19px/600. While streaming, a 3-step checklist (`…` current, `✓` done, `·` upcoming at 0.4): *Writing SQL* → *Running on fraud.duckdb (read-only)* → *Summarising the result* — map to tool part states `input-streaming` / `input-available` / `output-available` + text streaming.
- **Answer**: optional headline stat (38px/600 `#ff8a8d`) + label, then 14px answer text. To get the stat, extend the system prompt in `lib/askPrompt.ts` to lead with one key figure, or add a tiny structured tool `headline({value,label})`.
- **Evidence card** (Card, bg `#0a0a0a`): header "EVIDENCE" (10px .12em `#ff6b6f`) + mono "SELECT only · N rows · T ms"; SQL `<pre>` Geist Mono 11.5px lh 1.6, keywords `#8f8f8f` 600, numbers `#ff8a8d`; result table (10px uppercase mono headers; rows 12px tabular) with a trailing inline bar column sized by `fraud_rate_pct` (or last numeric col); footer "fraud.duckdb · opened read-only" + "Hide SQL / Show SQL" toggle. Always render the SQL (SPEC invariant 4). Error state: red text in the evidence card.
- Composer: input + primary "Ask" button (disabled when empty/busy), helper "Every answer shows the SQL it ran. Writes are refused."
- Chapter buttons on Story call the same `ask(question)` and open the panel — lift `useChat` into a client context provider in the layout so the panel and `/ask` share one conversation.

---

## State
- Layout (client provider): `panelOpen`, `chat` (`useChat()`), `ask(text)`.
- Story: `activeChapter`.
- Explorer: `filter` (`all|flagged|fraud|micro|hot`), `query`; sort by score desc.
- Message: `showSql` per message.

## Data changes needed
- `score` per explorer row: export holdout/in-sample model probability in `pipeline/export_web_data.py` into `features.parquet` or a sidecar parquet; add `purchase_amount`, `subsector_description` to `explorerRows()` via a join on `transaction_id`.
- Amount-band rates query (Patterns).
- Update `pipeline/check_parity.py` for any new aggregates.

## Design tokens
- Background `#0a0a0a` · surface `#0f0f0f` · border `#262626` · strong border `#2e2e2e` · text `#ededed` · muted `#a1a1a1` / `#8f8f8f` · neutral bar `#454545`
- Accent (fraud signal) ramp: 100 `#2b1214` · 200 `#3b1719` · 300 `#5c1f22` · 400 `#8c2a2e` · 500 `#c93a3f` · 600/base `#e5484d` · 700 `#ff6b6f` · 800 `#ff8a8d` · 900 `#ffd1d2`
- Muted text = `#ededed` at 55–75% (`color-mix` or Tailwind `/60`).
- Type: Geist Sans 400/500/600; Geist Mono 400/500. Scale 10 · 11 · 12 · 13 · 14 · 15 · 17 · 19 · 24 · 28 · 36 · 44 · 56. Headings tracking −0.03 to −0.04em. Uppercase kickers 10–11px, tracking .1–.14em.
- Radius: cards 12, buttons/inputs 8, pills 999. No shadows.
- Spacing: page gutters 40px; section padding 44px; grid gaps 20/28/36.

## Assets
No images or icons. Brand mark is an 8px red dot. If icons are added, use `lucide-react` at stroke 1.5.

## Files
- `Redesign B - Geist Dark.dc.html` — the prototype (all six views, logic in the `<script>` class; `CANNED` and `CHAPTERS` arrays contain exact copy).
- `fraud-data.js` — figures used by the prototype.
- `reference/Current UI.dc.html` — recreation of the current UI.
