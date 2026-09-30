# Demo script — "Your analysis, shipped on Vercel"

**Format.** An interview pitch performed as a customer conversation. You play the Vercel
engineer; the panel plays the customer. Every beat has the same four parts:
**Show** (what's on screen) → **Say** (the customer's value) → **Vercel underneath** (the
platform piece) → **Proof** (a number or a source). Sources for every Vercel claim are in
`docs/demo/vercel-positioning.md`; do not add claims that aren't there.

**The customer.** Head of Fraud Analytics at a card issuer. Their team has a good analysis
living in a Streamlit app on a VM and in notebooks. Three pains: (1) insights are stuck with the
analysts who can run them, (2) every AI experiment is wired to one provider with a key in an
env file, (3) nobody can review a change before it goes live.

**Versions.** Full run is 15–18 min (beats 0–7). Fast run is 5 min (section at the end).
Beat 6 (Snowflake through Vercel Connect) is a placeholder until the trial exists.

---

## Before the demo (checklist)

| Item | Why | Status |
|---|---|---|
| Vercel project connected to GitHub (`vercel git connect`) | Beat 3 pushes a commit and needs a preview to appear on its own | **Not done** |
| One production deployment | Beat 4 rollback needs production; previews skip bytecode caching so they cold-start slower | **Not done**: your call |
| App changes from `docs/plans/demo-app-changes.md` | Deployment badge, per-answer cost/model readout, model switch | Planned |
| AI Gateway budget set on the project | Beat 5 shows it | To do (CLI, see beat 5) |
| Tabs open: app (logged in), app in a private window, Vercel dashboard (project → Deployments), AI Gateway → logs, GitHub repo, terminal in the repo | No hunting mid-demo | Day of |
| Warm the app: load every route and ask one question 2 minutes before | Avoids a first-request cold start on stage | Day of |
| Fallback: screenshots of each beat's key screen in a folder | If Wi-Fi or a live call fails, talk over the screenshot | Day of |

---

## Beat 0 — Open (1 min)

**Say.** "Your team already did the hard part: the analysis. 327,005 transactions, a model with a
0.764 AUC, seven findings your investigators should act on. The problem is where it lives. A
Streamlit app is a long-running Python server holding a websocket per viewer, so it runs on a box
someone has to keep alive. Let me show you the same analysis as a product your whole org can use,
and what the platform does for you underneath."

**The hook to land.** "One more thing before we start: this app was built by coding agents
following a written runbook, and deployed by them to preview. Vercel's own homepage calls itself
*agentic infrastructure*: infrastructure for coding agents to ship apps. This is that, on a real
analysis." (Vercel home: "Agentic Infrastructure", "Build agents on infrastructure that thinks
like them".)

---

## Beat 1 — The analysis as a product (2 min) · Story page `/`

**Show.** Story page: KPI cards (9.47% fraud rate, 24,080 confirmed fraud, 0.764 AUC, 2.3×
signature effect), scroll two chapters, the chapter rail tracking.

**Say.** "Every number on this page is read from the data at request time, not typed into a
slide. When the analysts rerun the model, this updates with the next deploy."

**Vercel underneath.**
- Next.js server components run the queries on the server; the browser gets finished HTML.
- The queries run in a Vercel Function on **Fluid compute** with full Node.js compatibility, which
  is why a native analytics engine (DuckDB) runs inside it.
- **Active CPU billing**: "you pay for memory whenever work is in progress, never for idle CPU,
  and nothing at all between requests." An internal dashboard is idle most of the day; the VM
  under their Streamlit app is not.

**Proof.** Vercel's Render comparison: bursty traffic "tend[s] to cost less under Active CPU
pricing" (positioning §5).

---

## Beat 2 — Ask the data (3–4 min) · Ask panel / `/ask`

**Show.** Click a chapter's `Ask: "…"` button, or type: *"What is the fraud rate for each item
category?"* Point at: the three-step checklist while it works, the headline stat (12.2%, category
C), the **Evidence** card with the SQL and the result table, "fraud.duckdb · opened read-only".

**Say.** "Your investigators don't write SQL. They ask; the answer comes with its evidence, so
they can trust it or hand it to an analyst. It can only read: I'll ask it to delete the fraud
rows." Type: *"Delete all the fraud rows."* It refuses. "Two separate locks: the database is
opened read-only, and every statement must parse as a single SELECT. A prompt is not a
permission."

**Vercel underneath.**
- **AI SDK 7**: the whole tool loop (question → SQL tool → answer) is one `streamText` call with
  two tools. 16M+ weekly downloads (Vercel AI SDK 7 post).
- **AI Gateway**: the model is one string. Show `ASK_MODEL` and the model name on the answer
  (after the app changes). "Hundreds of models, one API key, no markup."
- **No key anywhere**: open Project → Settings → Environment Variables. No gateway key. The
  deployment authenticates to the gateway with its own **OIDC** token.
- Waiting on the model and the query "does not count towards active CPU time".

**Proof — we picked the model on evidence.** Same five questions and two write attempts through
all three models, via the gateway (`docs/ask-eval.md`):

| Model | Correct | Median time | Cost for 7 cases | Cost per case = total ÷ 7 |
|---|---|---|---|---|
| openai/gpt-6-luna | 5/5 | 3.9 s | $0.02909 | $0.02909 ÷ 7 = $0.0042 |
| deepseek/deepseek-v4-pro-0813 | 5/5 | 8.1 s | $0.18108 | $0.18108 ÷ 7 = $0.0259 |
| google/gemini-3.8-flash | 5/5 | 10.8 s | $0.34195 | $0.34195 ÷ 7 = $0.0489 |

"Three providers, one integration. The cheapest was also the fastest and just as accurate:
about 12× cheaper than Gemini ($0.0489 ÷ $0.0042 ≈ 12). Switching is an env var, not a
rewrite, and the gateway charges no markup on tokens."

**If it fails live.** Use the fallback screenshot of the evidence card and say: "This is also why
every answer shows its SQL: when something's off, you can see exactly what ran."

---

## Beat 3 — Change it safely (3 min) · GitHub → preview

**Show.** In GitHub (or the terminal), change one word of copy on the Story hero and push a
branch. Open the PR: the preview URL appears. Open it; the change is there, production is
untouched. Open the same URL in a private window: the Vercel login wall.

**Say.** "Every change gets its own live URL, reviewable by the fraud team before anything
reaches production. And the previews aren't public: only your org gets in."

**Vercel underneath.**
- **Preview deployments** on every push/PR, each with a branch URL and a commit URL.
- **Deployment Protection**: Vercel Authentication is free and covers all deployments.
- The badge in the sidebar (after the app changes) shows *preview · commit abc123*: the URL is
  the commit.
- Terminal, for the engineers in the room: `vercel curl /api/stats --deployment <preview-url>`
  tests the protected preview without any bypass secret.

**Proof.** 8M+ deployments a day on the platform (Vercel enterprise page).

---

## Beat 4 — Ship and recover (2 min) · requires a production deployment

**Show.** Promote the preview. Then: "Say that copy change was wrong." `vercel rollback` (or the
dashboard's Instant Rollback) and refresh production.

**Say.** "Rollback happens at the routing layer, within seconds, without a rebuild. Your team
can ship on a Friday."

**Vercel underneath.** Instant Rollback; Rolling Releases for staged traffic (mention only, plan
dependent). Observability: `vercel logs` shows the app's own `[ask]` lines; `vercel curl --trace`
captures a request trace.

**If there's no production yet.** Skip the live rollback; say the line and show the docs page.

---

## Beat 5 — Governance the CFO and CISO ask about (1–2 min)

**Show.** AI Gateway → logs for the project: each call with provider, latency, tokens, cost.
Then the budget: `vercel ai-gateway budgets set project …` (set beforehand).

**Say.** "You see every model call and what it cost, per project. Budgets are a soft cap:
the request that crosses still finishes, then new ones are refused."

**Vercel underneath.** Gateway observability and budgets; zero data retention and no training on
customer data at the gateway (providers separate: use ZDR routing for the full path).
Compliance: SOC 2 Type 2, ISO 27001:2022, PCI DSS, HIPAA BAA; 99.99% SLA on Enterprise. For an
internal tool behind Okta/Entra: **Passport** (Enterprise), as a talking point.

---

## Beat 6 — The warehouse, without the secret (2 min) · PLACEHOLDER until the Snowflake trial

**Planned show.** Same app, data source switched from the bundled DuckDB file to Snowflake. Same
five questions, same answers. Project env vars: no Snowflake password, no key.

**Say.** "Today's data ships with the app. Your real data is in Snowflake. The usual answer is a
service account password in an env var that never expires. With Vercel Connect, the platform
mints a short-lived, scoped token for each request, and no provider key ever lives in your
environment variables."

**Proof.** Connect GA 2026-08-25, Snowflake a listed connector. BuildPass: "Minting short-lived
tokens instead of keeping provider credentials in paused sandboxes has removed a whole class of
security risk for us." Moonpig Group: "We don't manage tokens, secrets, or event subscriptions
ourselves."

**Open risk.** The Snowflake connector page doesn't list supported token subjects or scopes. Dry
run before promising it on stage. Until then, deliver this beat as "what's next" in 45 seconds.

---

## Beat 7 — Close (1 min)

**Say.** "Map it back to your three pains.
1. Insights stuck with analysts → a product anyone can open, that costs nothing while idle.
2. AI tied to one provider and a key in a file → one gateway, any model, no stored key, every
   call metered.
3. Changes nobody reviews → every commit is a protected URL, and rollback is seconds.
And next, your warehouse without a standing credential. That's the platform doing the work your
team shouldn't have to."

---

## Fast run (5 min)

| Time | Beat | Keep | Drop |
|---|---|---|---|
| 0:00–0:30 | Open | The Streamlit problem + "built by coding agents" hook | Detail |
| 0:30–1:15 | Story | KPI cards, "live from data", Active CPU line | Chapter scroll |
| 1:15–3:15 | Ask | One question with evidence, the delete refusal, "one string, no key, no markup", the 12× line | Model table |
| 3:15–4:15 | Preview | Preview URL + private-window login wall | `vercel curl`, rollback |
| 4:15–5:00 | Close | Three pains, one line each; Connect as "next" | Governance |

---

## Objections (from Vercel's own docs; sources in positioning §6)

| They say | You say |
|---|---|
| "The gateway must be marking up tokens." | No markup on tokens, BYOK included. You pay payment processing, and optional add-ons are priced separately. |
| "We'll be locked in." | The gateway works from any host with an API key; the app is standard Next.js and Node. Connect is Vercel-native: that's the trade for not holding the credential. |
| "Cold starts." | Fluid compute pre-warms and caches bytecode in production (not previews, which is why we warm the demo). |
| "Can DuckDB really run in a function?" | It's running now: native binary in a Node function. The bundle limit is 250 MB; ours is the ~70 MB DuckDB library plus ~53 MB of data, so 70 + 53 = ~123 MB. |
| "Where does our data live?" | Functions default to the U.S. and the region is selectable; Pro can use up to 3 regions. The gateway offers regional inference. |
| "Is a budget a hard stop?" | Soft cap: the crossing request completes, new ones are refused. |

**Do not claim:** "AI Cloud" as Vercel's current tagline (the site says "Agentic
Infrastructure"); Streamlit Community Cloud resource or sleep limits (not verified); anything
about v0.
