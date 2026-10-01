# Objections research: why buyers push back, and why they pick someone else

Last verified: 2026-10-01 (Vercel URLs re-fetched; see `verification-2026-10.md`). Non-Vercel sources keep their own accessed dates. APRA quotes and the CPS 230 date stay unverified.

Researched 2026-10-01 (all "accessed" dates below). Companion to `vercel-positioning.md` and `governance-research.md`; it does not repeat them. Every entry has a claim, a short quote, the URL, the publisher, the publication or page date, and the date accessed. Entries are split into **Facts** (vendor pricing pages, official docs, regulator text) and **Opinion** (blogs, analyst and forum pieces). Anything not confirmed on a page is marked **UNVERIFIED**.

**Method note.** Quotes came back through the fetch tool's page summariser, so wording may be trimmed. Re-check regulator quotes against the PDF before putting them on a slide. Pricing figures are dated per entry and change often.

IDs (`R-xx`) are what objection files cite in their `## Sources`.

---

## A. Competitors and why buyers choose them

### Facts

**R-01 · Vercel Pro bandwidth and seats.** Pro includes 1 TB then per-GB overage; $20 per developer seat.
> "1TB / month included; then starting at $0.15 per GB"
Vercel, https://vercel.com/pricing · page undated · accessed 2026-10-01. Price as of 2026-10-01.

**R-02 · Vercel Fluid compute is metered, region by region.** Active CPU pauses on I/O; memory does not. `syd1` rates: $0.180 per CPU-hour, $0.0149 per GB-hour (`iad1`: $0.128 and $0.0106). Invocations $0.60 per million on Pro.
> "you pay for memory whenever work is in progress, never for idle CPU, and nothing at all between requests"
Vercel docs, https://vercel.com/docs/functions/usage-and-pricing · last_updated 2026-06-16 · accessed 2026-10-01. Prices as of 2026-06-16. Note the Sydney premium: 0.180 / 0.128 = 1.41, about 41% more CPU-hour cost than Washington.

**R-03 · AWS Amplify Hosting price list.** Data transfer $0.15 per GB, SSR requests $0.30 per million, SSR compute $0.20 per GB-hour.
> "$0.15 per GB served"
AWS, https://aws.amazon.com/amplify/pricing/ · page references 2025-07-15 free-tier change · accessed 2026-10-01. Bandwidth rate is the same as Vercel Pro overage ($0.15), but sits inside an AWS bill, so it can fall under an existing AWS commitment (see R-14).

**R-04 · Netlify Pro and Enterprise.** Pro $20 per month with credit-based metering (about $0.13 per GB bandwidth). Enterprise lists 99.99% SLA, SSO and SCIM, log drains, 24/7 support.
> "Enterprise plans include '99.99% SLA,' 'SSO & SCIM,' 'Log drains,' and '24/7 dedicated support'"
Netlify, https://www.netlify.com/pricing/ · undated · accessed 2026-10-01. Same shape as Vercel's tier story: the governance controls sit on the top tier.

**R-05 · Cloudflare Workers has no egress charge.** Paid plan $5 per month, 10 million requests included.
> "no additional charges for data transfer (egress) or throughput (bandwidth)"
Cloudflare, https://developers.cloudflare.com/workers/platform/pricing/ · updated 2026-08-28 · accessed 2026-10-01. This is the strongest cost objection for bandwidth-heavy sites. This demo is not bandwidth-heavy.

**R-06 · Vercel's own account of Next.js on Cloudflare.** Vercel says full feature support lands on Vercel first and runs on full Node.js.
> "Vercel maintains Next.js, so the framework runs with full feature support, and new capabilities land on Vercel first."
Vercel KB, https://vercel.com/kb/guide/next-js-on-vercel-vs-cloudflare · published 2026-06-11, updated 2026-09-29 · accessed 2026-10-01. Vendor framing, not neutral. Also says Workers Free allows "up to 10 ms of CPU time per invocation". DuckDB's native library needs a Node runtime (see `vercel-positioning.md` §6), which is a reason this app does not fit Workers.

**R-07 · Azure Static Web Apps hosts Next.js, with limits.** Hybrid Next.js is a preview feature on SWA, backed by an App Service instance.
> "Hybrid Next.js applications (preview)" … "The maximum app size for the hybrid Next.js application is 250 MB."
Microsoft Learn, https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs · ms.date 2024-04-25, updated 2026-01-23 · accessed 2026-10-01. Linked backends need the Standard plan and an S1 App Service plan. For a bank that is all-in on Azure, this is a real, supported route with a lower feature ceiling.

**R-08 · Streamlit in Snowflake keeps app and data inside the warehouse.**
> "build applications that process and use data in Snowflake without moving data or application code to an external system"
Snowflake docs, https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit · undated (2026 copyright) · accessed 2026-10-01. Access runs through Snowflake RBAC. This is the better fit when the data already lives in Snowflake and the tool is a Python dashboard.

**R-09 · Databricks Apps governs through Unity Catalog and supports Node.js frameworks.**
> "build and deploy secure data and AI applications directly on the Databricks platform, which eliminates the need for separate infrastructure"
Databricks docs, https://docs.databricks.com/aws/en/dev-tools/databricks-apps/ · last updated 2026-09-16 · accessed 2026-10-01. Supports Streamlit, Dash, Gradio, and React, Angular, Svelte, Express.

**R-10 · Retool prices per builder and offers self-hosting.** Business plan builder $50 per month (annual), Enterprise adds SAML/OIDC SSO and SCIM; "All tiers support on-premises deployment".
Retool, https://retool.com/pricing · undated · accessed 2026-10-01. Prices as of 2026-10-01.

**R-11 · Power Platform data policies are connector-level guardrails, off by default.**
> "By default, no data policies are implemented in the tenant."
Microsoft Learn, https://learn.microsoft.com/en-us/power-platform/guidance/adoption/dlp-strategy · updated 2026-08-29 · accessed 2026-10-01. Policies "are connector aware, but they don't control connections made using the connector". An existing Power Platform tenant gives IT a governance console the bank already runs.

**R-12 · Railway bills per second with no idle charge.** Memory about $10 per GB per month, egress $0.05 per GB.
Railway, https://railway.com/pricing · undated · accessed 2026-10-01. Always-on-cheap alternative for small teams. No compliance claims confirmed: **UNVERIFIED** for bank use.

**R-13 · Render.** Pricing page content did not load through the fetch tool. **UNVERIFIED**: no Render price, region or compliance figure is cited. Vercel's own comparison (positioning §5) is the only Render source we hold, and it is vendor framing.

**R-14 · OpenShift / Kubernetes as the internal platform.** The Red Hat overview URL tried returned 404. **UNVERIFIED**: no source cited. The argument ("we already run a platform") is covered by the shadow-IT entries below.

### Opinion

**R-15 · Teams leave for cost, seats, and cloud commitments.** A vendor-adjacent comparison blog (Qovery) says teams outgrow Vercel at "the first bandwidth invoice big enough that they wish it sat inside a cloud commitment they already own", and notes the per-GB price "cannot be discounted by the Savings Plans or Committed Use Discounts you may have already signed".
Qovery blog, https://www.qovery.com/blog/vercel-alternatives-backend-databases-own-cloud-account · undated · accessed 2026-10-01. Qovery sells a competing product. Treat as opinion; the logic (existing AWS spend commitments) is sound, the numbers are theirs.

**R-16 · "Vercel bills spike without warning".** Aggregator blogs describe usage bills, per-seat pricing and build defaults as the three complaints (deploywise.dev, flexprice.io, massivegrid.com, temps.sh). None is neutral; several sell self-hosting. https://deploywise.dev/blog/vercel-pricing-explained · undated · accessed 2026-10-01. Anecdotal; **UNVERIFIED** as to typical bill sizes.

**R-17 · Lock-in framing.** Commentary calls it "the tight coupling between advanced Next.js features (like On-demand ISR, Edge Middleware, Server Actions) and Vercel's proprietary infrastructure". OpenNext is the open-source adapter that runs Next.js on AWS, Cloudflare and Netlify. Sources: https://medium.com/@kouta9369/opennext-vs-32e33fd45289 and https://kanopylabs.com/blog/cloudflare-opennext-vs-vercel-nextjs · undated · accessed 2026-10-01. The portability claim is third-party; behaviour parity is not guaranteed.

**R-18 · Citizen development drifts into shadow IT.** Quickbase (a low-code vendor): "citizen development can easily veer into shadow IT". A KPMG survey is cited there: "73% of low-code planners (and 65% of users) have not yet defined governance rules". https://www.quickbase.com/blog/taming-shadow-it-citizen-developer-governance · undated · accessed 2026-10-01. The KPMG figure is second-hand: **UNVERIFIED** at source.

**R-19 · Ownership once an app becomes essential.** Same search results: when an app becomes essential to operations "the original creator shouldn't be solely responsible for something the company depends on". Opinion, https://www.txminds.com/blog/low-code-governance-citizen-development/ · undated · accessed 2026-10-01.

---

## B. Australian bank objections to cloud and AI platforms

### Facts (regulator text)

**R-20 · CPS 230, notify APRA of material provider arrangements.**
> "as soon as possible and not more than 20 business days after entering into or materially changing an agreement for the provision of a service on which the entity relies to undertake a critical operation"
APRA, https://www.apra.gov.au/standards/cps-230 · para 60 per page summary · accessed 2026-10-01.

**R-21 · CPS 230, material offshoring needs prior notice.**
> "prior to entering into any material offshoring arrangement, or when there is a significant change proposed to the arrangement, including in circumstances where data or personnel relevant to the service being provided will be located offshore"
APRA, same page, para 60 · accessed 2026-10-01. **Date conflict:** this fetch reported "determination 23 April 2026, commencement 1 July 2026"; `governance-research.md` says in force 1 July 2025. Do not state a commencement date in the room until checked against the PDF.

**R-22 · CPS 230, concentration risk in due diligence.** Para 52(b) per the page summary: assess "risks associated with geographic location or concentration of the service provider(s) or parties the service provider relies on in providing the service". APRA, same page · accessed 2026-10-01.

**R-23 · CPS 234, third-party assets.**
> "Where information assets are managed by a related party or third party, the APRA-regulated entity must assess the information security capability of that party, commensurate with the potential consequences of an information security incident affecting those assets."
APRA, https://www.apra.gov.au/standards/cps-234 · para 16 · accessed 2026-10-01. Para 22 adds: "evaluate the design of that party's information security controls".

**R-24 · CPS 234, 72-hour incident notice.**
> "no later than 72 hours, after becoming aware of an information security incident"
APRA, same page, para 35 · accessed 2026-10-01.

**R-25 · APRA AI letter, monitoring, drift and oversight.** Dated 2026-04-30. Quotes: "understand model behaviour, material changes, performance issues and outcomes"; "Human involvement for high-risk decisions and accountability"; "detect issues such as model drift, bias, failure modes, or control breakdowns"; "weak model behaviour monitoring, change management, and decommissioning of AI". APRA, https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai · accessed 2026-10-01.

**R-26 · APRA AI letter, single-provider dependence.**
> "heavily dependent on a single provider for multiple AI use cases"
APRA, same letter · accessed 2026-10-01. Pair with the gateway's multi-provider routing (`vercel-positioning.md` §3) and the three-model test in `demo-script.md` Act 4.

**R-27 · Where Vercel processes data.**
> "Vercel may transfer data to and in the United States and anywhere else in the world where Vercel or its service providers maintain data processing operations."
Vercel docs, https://vercel.com/docs/security/compliance · last_updated 2026-09-08 · accessed 2026-10-01. Same page: the platform "primarily uses Amazon Web Services (AWS)"; default Functions location "is the U.S."; SOC 2 Type 2, ISO 27001:2022 and PCI DSS (shared responsibility) listed.

**R-28 · Where model inference runs.** `us` and `eu` regional inference only, no Australia; gateway hop not region-pinned. Already researched in `governance-research.md` §3. Not repeated here.

### Opinion

**R-29 · Practitioners read cloud hosting as a material service provider.** A law-firm and consultancy summary says examples of material providers "include providers of cloud hosting, data processing, credit assessment, or claims management". https://nexustechconsulting.com.au/blog/cps-230-material-service-provider-explained.html · undated · accessed 2026-10-01. Interpretation, not APRA text. Whether a fraud-investigation tool is a *critical operation* is the bank's call.

---

## C. Shadow IT and citizen-developer objections

**R-30 · Governance vacuum (opinion).** See R-18 and R-19. Fact side: Power Platform ships with no data policies on by default (R-11). Vercel has no page on discovering or adopting apps built outside IT (`governance-research.md` §5), so the platform levers (team-wide protection defaults, provider allowlist, Access Groups) are inference, not a Vercel claim.

**R-31 · "We already have a platform."** The honest comparator list is R-07 (Azure), R-08 and R-09 (warehouse-native apps), R-11 and R-10 (low-code), and the OpenShift gap in R-14. No Vercel source says a bank should replace any of them.

---

## D. AI-in-the-tool objections

### Facts

**R-32 · Vercel does not retain prompts; upstream providers are a separate question.**
> "AI Gateway itself does not retain prompt or response content: it is deleted once the request completes."
Vercel docs, https://vercel.com/docs/ai-gateway/faq · last_updated 2026-09-13 · accessed 2026-10-01. Also: "Vercel's own retention policy does not constrain providers, so enable these controls when you need a guarantee that covers the whole path." Metadata (model, provider, tokens, cost, every routing attempt) is logged; routing detail kept 30 days.

**R-33 · Gateway pricing and portability.**
> "AI Gateway charges the provider's list price with no platform markup on tokens"
and "nothing about AI Gateway requires deploying to Vercel". Same FAQ page · 2026-09-13 · accessed 2026-10-01. Purchased credits expire one year after purchase.

### Opinion / research

**R-34 · Text-to-SQL accuracy drops on enterprise databases.** An arXiv survey summary says models strong on Spider and BIRD see "execution accuracy drops sharply on enterprise datasets such as Beaver". SQL hallucination means models "invent tables and columns that do not exist". Sources found via search: https://arxiv.org/html/2403.02951v1 and https://www.falkordb.com/blog/sql-hallucinations-semantic-layers/ · undated in our reading · accessed 2026-10-01. **UNVERIFIED** at the primary paper: we did not open the Beaver result. What we hold instead is our own: `docs/ask-eval.md` (5 of 5 correct on each of three models, a small set).

**R-35 · A checker model can be fooled.** Peer-reviewed and preprint evidence that guardrail classifiers are bypassable:
> "both methods can be used to evade detection while maintaining adversarial utility achieving in some instances up to 100% evasion success"
Hackett et al., arXiv 2504.11168, submitted 2025-04-15 (v3 2025-07-14), https://arxiv.org/abs/2504.11168 · accessed 2026-10-01. Tested six systems including Azure Prompt Shield and Meta Prompt Guard; not Jev.

**R-36 · Same-class judge, same weakness.**
> "If the same type of model used to generate responses is also used to evaluate safety, both can be compromised in the same way."
HiddenLayer, https://www.hiddenlayer.com/research/same-model-different-hat · 2025-10-10 · accessed 2026-10-01. Vendor research. It targets same-model judges; this demo's checker is a different model, and the database lock (read-only, one SELECT) does not depend on any model. Say both.

---

## Coverage by theme

| Theme | Fact entries | Opinion entries | Unverified gaps |
|---|---|---|---|
| Competitors / cost / lock-in | R-01 to R-12 | R-15 to R-17 | Render (R-13), OpenShift (R-14), Railway bank fit |
| Sovereignty and regulator | R-20 to R-28 | R-29 | CPS 230 commencement date conflict (R-21); APRA access rights in Vercel's DPA (governance-research §1) |
| Shadow IT | R-11 | R-18, R-19, R-30, R-31 | KPMG 73% figure (R-18) |
| AI risk | R-25, R-26, R-32, R-33 | R-34 to R-36 | Beaver benchmark (R-34); Jev not tested in R-35 |
