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

## E. Leads checked on 2026-10-01 (from `leads/gemini-2026-10-01.md`)

These came from Gemini as unverified leads (L-01 to L-23). Each entry below has a primary source: a Vercel page, a Vercel page quoting an analyst, an analyst's own page, or a competitor's own docs. Leads with no primary source are in "Leads not confirmed" at the end of this section. All entries accessed 2026-10-01.

### Facts

**R-37 · Vercel's April 2026 security incident (lead L-04).** Vercel's own bulletin: the incident started with a compromise of a third-party AI tool used by one Vercel employee, and ended with attackers reading non-sensitive environment variables of a limited subset of customers.
> "a compromise of Context.ai, a third-party AI tool used by a Vercel employee" ... "take over the employee's individual Vercel Google Workspace account" ... "subsequently maneuvered through systems to enumerate and decrypt non-sensitive environment variables."
Vercel, https://vercel.com/kb/bulletin/vercel-april-2026-security-incident · first published 2026-04-19, updated through 2026-04-24 · accessed 2026-10-01. Affected: "a limited subset of customers whose non-sensitive environment variables stored on Vercel ... were compromised", plus "a small number of additional accounts that were compromised" and a few accounts with signs of compromise unrelated to the incident. The bulletin timeline records that npm packages were validated as uncompromised (2026-04-20). The bulletin does not say how many customers. Third-party write-ups name an infostealer and a February 2026 start; those are secondary and not recorded as fact here.

**R-38 · What customers had to do after the incident (L-04).** Vercel's recommended customer actions.
> Rotate "environment variables that were not marked as 'sensitive'" treating them as "potentially exposed"; enable multi-factor authentication via authenticator apps or passkeys; review account activity logs and recent deployments; use the "sensitive environment variables feature"; keep "Deployment Protection ... set to Standard at a minimum"; rotate "Deployment Protection tokens, if set".
Vercel, same bulletin · accessed 2026-10-01.

**R-39 · What Vercel changed afterwards (L-04).** Product changes the bulletin lists.
> "Better environment variable management, with stronger defaults, improved safeguards, and in-product education"; "New team-wide management and security overview of environment variables"; "Easier to use activity log."
Vercel, same bulletin · accessed 2026-10-01. The sensitive-variable mechanics are on https://vercel.com/docs/environment-variables/sensitive-environment-variables (last_updated 2026-08-28): sensitive values are "non-readable once created", only for preview and production, and a team Owner can switch on "Enforce Sensitive Environment Variables" so every new variable in those environments is sensitive. The page does not state a plan requirement. This app's gateway auth is OIDC with no key in an environment variable (SPEC invariant 5).

**R-40 · Maximum function duration (L-05, L-11, L-22).** Vercel Functions on Fluid compute: Hobby 300 s default and maximum. Pro and Enterprise 300 s default, 800 s maximum (generally available), 1800 s extended maximum (beta).
> "The 800 second maximum is generally available for Pro and Enterprise teams. The 1800 second extended maximum is in beta."
Vercel docs, https://vercel.com/docs/functions/limitations · last_updated 2026-08-24 · accessed 2026-10-01. Values above 800 s need per-function config and are not supported with Secure Compute or Static IPs. For longer work the page points to Vercel Workflows. Lead L-05's "5-minute timeout on Pro" is the default, not the maximum.

**R-41 · WebSockets in Functions (L-16, L-22).** Supported, in public beta since 2026-06-22. A connection is pinned to one function instance and closes when the function reaches its maximum duration; billing follows the Active CPU model.
> "Vercel Functions can now serve WebSocket connections, enabling bidirectional communication between clients and server-side code on Vercel." / "WebSocket connections close when a Vercel Function reaches its maximum duration."
Vercel changelog, https://vercel.com/changelog/websocket-support-is-now-in-public-beta · 2026-06-22; docs https://vercel.com/docs/functions/websockets · last_updated 2026-08-10 · accessed 2026-10-01. State must live outside the instance (the docs suggest Redis). The Next.js route uses `experimental_upgradeWebSocket()`. Lead L-16's "no WebSockets" is out of date for Vercel.

**R-42 · Workflows and Queues (L-11, L-22).** Vercel Workflows runs durable multi-step code that can pause "for minutes or months" and survive deployments and crashes. Vercel Queues entered public beta on 2026-02-27, at-least-once delivery, from $0.60 per million operations.
> "Vercel Workflows runs multi-step logic as durable code that can retry failed steps, wait for external events, and resume across crashes and deployments." / Queues: "at-least-once delivery semantics".
Vercel docs, https://vercel.com/docs/workflows · last_updated 2026-09-04; changelog https://vercel.com/changelog/vercel-queues-now-in-public-beta · 2026-02-27 · accessed 2026-10-01. The Workflows page does not state a beta or GA label in the text read. Queues is the layer Workflows uses.

**R-43 · Sandbox and `waitUntil` (L-11, L-22).** Vercel Sandbox runs untrusted or agent-generated code in isolated Firecracker microVMs, with Active CPU pricing. `waitUntil` extends a request handler's life, but only to the function's own timeout.
> Sandbox: "Run untrusted or agent-generated code in isolated Linux microVMs." / `waitUntil`: "Promises passed to `waitUntil()` will have the same timeout as the function itself. If the function times out, the promises will be cancelled."
Vercel docs, https://vercel.com/docs/sandbox · last_updated 2026-09-22; https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package · last_updated 2026-09-03 · accessed 2026-10-01. A related-links title on the Sandbox page calls it "now generally available"; the page text itself does not label it. In Next.js 15.1 and later the docs recommend `after()` instead of `waitUntil()`. Lead L-22's "`waitUntil` softens the limits" is right but bounded by max duration (R-40).

**R-44 · 4.5 MB body limit (L-05).**
> "The maximum payload size for the request body or the response body of a Vercel Function is **4.5 MB**."
Vercel docs, https://vercel.com/docs/functions/limitations · last_updated 2026-08-24 · accessed 2026-10-01. Over the limit the function returns 413.

**R-45 · GPUs (L-05, L-16).** Vercel's own comparison with Northflank describes Vercel as application-layer AI and leaves GPU work to other providers; Northflank lists GPU types. No Vercel page offers GPU compute.
> Vercel: "Application-layer AI (Gateway, SDK); teams add GPU providers for training". Northflank: "18+ GPU types".
Vercel KB, https://vercel.com/kb/guide/vercel-vs-northflank · published 2026-03-20, updated 2026-09-30 · accessed 2026-10-01. Vendor framing, but it is Vercel's own page conceding the point. Third-party blogs agree that Vercel Sandbox has no GPU; those are secondary. Same page: WebSockets close at max duration; Vercel max timeout "up to 1,800s (30 min) on supported runtimes (Pro/Enterprise)"; Northflank has "no execution timeouts" and first-party databases, so Northflank wins for always-on workers and GPUs.

**R-46 · Private networking and VPC (L-15).** Secure Compute is Enterprise only and is a paid add-on. It gives a dedicated private network in a VPC with static IPs, VPC peering to an AWS VPC (up to 50 peerings per network), and site-to-site VPN to Azure, Google Cloud or on-premises. Static IPs (shared pool) are Pro and Enterprise at $100 per month per project, with no VPC peering. AWS PrivateLink needs Advanced Networking.
> "Secure Compute is available as an Enterprise feature. Contact your Vercel account team for pricing." / Static IPs: "$100/month per project ... plus Private Data Transfer".
Vercel docs, https://vercel.com/docs/networking/secure-compute · last_updated 2026-09-23; https://vercel.com/docs/networking/static-ips · 2026-06-30; KB https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address · updated 2026-09-28 · accessed 2026-10-01. Limits: the Edge runtime and Routing Middleware do not use the dedicated IPs; large functions and the 1800 s duration beta are not supported; Private Data Transfer is $0.15 per GB off the private network; self-service network creation is "not available to all Enterprise teams". Lead L-15's "no custom VPC deployment" is wrong for Enterprise.

**R-47 · Pauses, fair use and suspensions (L-12).** Vercel's KB lists four causes of a pause: a spend limit the team set, usage beyond plan quotas (Fair Use Guidelines), policy violations (Terms, Acceptable Use, Fair Use, especially commercial use on Hobby), and platform incidents.
> "If Vercel pauses your account or deployment for a policy reason, the system emails you with the details and next steps." If no email arrives, "Vercel is unable to discuss the pause further."
Vercel KB, https://vercel.com/kb/guide/why-is-my-account-deployment-blocked · published 2025-11-03, updated 2026-09-23; fair use https://vercel.com/docs/limits/fair-use-guidelines · last_updated 2026-09-14 · accessed 2026-10-01. The fair-use page says "Where possible, we'll reach out before taking action". Projects do not resume automatically. Neither page says pauses are automatic for traffic spikes or billing anomalies; that part of L-12 is not confirmed. Hobby is "restricted to non-commercial personal use only".

**R-48 · Support tiers (L-12).** Support terms list Hobby (limited), Standard, Premium and Enterprise, and commit to response targets only for Enterprise subscriptions.
> "We only commit to respond to Customers with an Enterprise subscription" using the targets. Table as read: Severity 1 "< 4 business hours" (Standard) and "< 2 hours (24/7)" (Premium); Standard hours "8:00am to 6:00pm, Monday through Friday" for UTC+0 to UTC-8.
Vercel, https://vercel.com/legal/support-terms · undated · accessed 2026-10-01. The summariser mislabelled the table as "Enterprise Response Time Targets"; read the page before quoting a number. The Enterprise plan page lists a Support Center, a dedicated Success Manager and SLAs (https://vercel.com/docs/plans/enterprise · last_updated 2026-09-01).

**R-49 · Debugging and observability (L-10).** Logs, request traces, `vercel bisect`, rollback and Vercel Agent investigations exist; runtime log retention is short on lower plans.
> Runtime log retention: Hobby 1 hour; Pro 1 day; Pro with Observability Plus 30 days; Enterprise 3 days; Enterprise with Observability Plus 30 days.
Vercel docs, https://vercel.com/docs/logs/runtime · last_updated 2026-08-28; https://vercel.com/docs/observability · 2026-09-10 (`vercel curl --trace --json`, `vercel logs --status-code 500 --json`); https://vercel.com/docs/observability/debug-production-errors · 2026-05-28 (`vercel bisect`) · accessed 2026-10-01. Runtime log limits: 256 lines and 1 MB per request. "Black box" is opinion; the factual weak spot is short retention below Observability Plus.

**R-50 · Netlify built-ins (L-14).** Vercel's own comparison page credits Netlify with split testing, built-in forms, native serverless Postgres, commercial use on its free plan, and automatic secret scanning. Netlify's docs confirm built-in forms.
> Vercel KB: "Split Testing" ("A/B testing at the CDN level") and "Forms" ("form handling with function triggers, no backend needed"). Netlify docs: "Netlify's serverless form handling allows you to manage forms without extra API calls or additional JavaScript."
Vercel KB, https://vercel.com/kb/guide/vercel-vs-netlify · published 2026-01-23, updated 2026-09-30; Netlify, https://docs.netlify.com/forms/setup/ · updated 2026-09-16 · accessed 2026-10-01. Netlify "supports JavaScript/TypeScript and Go only" for function runtimes per the Vercel page. L-14's Next.js lock-in claim is covered by R-17 and R-06. Netlify identity was not checked.

**R-51 · Cloudflare's database and edge AI (L-13).** Cloudflare lists a managed serverless database and GPU-backed model hosting on its own network; zero egress is already R-05.
> D1: "Cloudflare's managed, serverless database with SQLite's SQL semantics". Workers AI: "Run machine learning models, powered by serverless GPUs, on Cloudflare's global network."
Cloudflare, https://developers.cloudflare.com/d1/ · updated 2026-04-30; https://developers.cloudflare.com/workers-ai/ · updated 2026-04-21 · accessed 2026-10-01. Cloudflare wins on built-in GPUs and database; the demo does not need either.

**R-52 · DDoS and TLS (L-08).** Platform DDoS mitigation covers L3, L4 and L7 on every plan, and blocked traffic is not billed. Data in transit uses TLS 1.3.
> "Vercel mitigates against L3, L4, and L7 DDoS attacks regardless of the plan you are on." / "While data is in transit ... Vercel uses HTTPS/TLS 1.3."
Vercel docs, https://vercel.com/docs/vercel-firewall/ddos-mitigation · last_updated 2026-08-11; https://vercel.com/docs/security/compliance · 2026-09-08 · accessed 2026-10-01. Enterprise teams get dedicated DDoS support. Usage is billed for requests served before mitigation starts. The AI-bot filtering part of L-08 was not found.

### Opinion and analyst

**R-53 · Forrester's note on the incident (L-04).** The note is titled "Game Over For Trust: A Roblox Cheat Gives Attackers The Advantage", published 2026-04-27 by seven Forrester analysts. It argues SaaS adoption has outpaced SaaS security maturity.
> "Vercel's design required users, both developers and nontechnical, to manually mark environment variables as 'sensitive' for protection, placing the burden on customers to ensure that secure defaults are used." ... "Vercel now defaults variables to 'sensitive,' but users may still uncheck it." ... "Vercel customers must audit all projects, prioritizing those with sensitive data."
Forrester, https://www.forrester.com/blogs/game-over-for-trust-a-roblox-cheat-gives-attackers-the-advantage/ · 2026-04-27 · accessed 2026-10-01. This is the analyst view a CIO may quote. It matches Vercel's bulletin on the facts (R-37) and adds the criticism about defaults. Lead L-04 said "April 2026"; confirmed. Its remark about shared-responsibility strain is the summariser's paraphrase; quote only the sentences above.

**R-54 · Gartner placements (L-01).** Vercel's own pages say it was named a Visionary in Gartner's 2024 Magic Quadrant for Cloud Application Platforms (published 2024-11-04) and a Visionary in the 2025 Magic Quadrant for Cloud-Native Application Platforms (2025-08-04).
> "Visionary in the 2024 Gartner Magic Quadrant for Cloud Application Platforms"; "Vercel is named a Visionary in the 2025 Gartner Magic Quadrant". Gartner's disclaimer, as Vercel prints it: "Gartner does not endorse any vendor, product or service depicted in its research publications".
Vercel, https://vercel.com/gartner-mq and https://vercel.com/gartner-mq-visionary · accessed 2026-10-01. These are Vercel pages quoting Gartner; Gartner's own page was not opened. The 2025 report has a different name. "Visionary" is below "Leader", so a CIO may read it as a reason to ask about maturity.

**R-55 · Forrester Wave: Edge Development Platforms, Q4 2023 (L-03).** Forrester's announcement (2023-12-06) names Vercel among 12 evaluated vendors: Akamai, AWS, Azion, Cloudflare, Cox Edge, Edgio, Fastly, Microsoft, Netlify, StackPath, Vercel, Yext. The announcement does not give placements.
Forrester, http://www.forrester.com/blogs/announcing-the-forrester-wave-edge-development-platforms-q4-2023/ · 2023-12-06 · accessed 2026-10-01. Search results from third parties describe Vercel as a "Strong Performer" ("only applicable to front-end web development"); that is secondary and **UNVERIFIED** at Forrester. Do not quote a placement.

### Leads not confirmed

| Lead | What Gemini said | What was found |
|---|---|---|
| L-02 | Gartner Peer Insights praise for DX and complaints about debugging, scaling costs, slow builds | Not checked at Gartner Peer Insights; no primary page read. Debugging facts are in R-49. |
| L-03 (placement) | Included in the Forrester Wave | Inclusion confirmed (R-55). "Strong Performer" is secondary only. |
| L-05 (rest) | AI SDK default for GenAI web UIs; about 10 ms edge latency | No primary source for either. 16M weekly AI SDK downloads is on Vercel's blog (V-12), not an analyst view. Duration, payload and GPU parts are R-40, R-44, R-45. |
| L-08 (part) | AI-bot filtering (GPTBot, ClaudeBot) | Not found on the DDoS or compliance pages. A bot-protection ruleset exists in beta per a related-link title; not read. L3/L4/L7 and TLS 1.3 are confirmed (R-52). |
| L-09 | About $150 per TB overage versus CloudFront | $0.15 per GB confirmed (R-01). The CloudFront comparison was not checked. |
| L-10 (part) | "Black box" debugging | Opinion. Tools and retention are in R-49. |
| L-12 (part) | Automated suspensions on traffic spikes or billing anomalies | Pauses exist for set spend limits, quota overuse and policy violations (R-47); nothing says spikes or billing anomalies trigger them. |
| L-15 (part) | TCO flips at scale; OpenNext or Amplify avoids the "Vercel tax" | Opinion, already R-15 and R-17. No new primary source. |
| L-19 | "Infrastructure as Code, without the YAML" | Marketing phrase; not found on a page read. `vercel.ts` is mentioned in the platform notes but not fetched. |
| L-21 | TCO is labour, not compute | Vercel's own positioning; no neutral source. Do not present as fact. |
| L-23 (part) | Preview comments | Only the REST note on external commenting (V-26); toolbar comments not verified. |
| L-04 (part) | Rapid-deploy platforms strain shared-responsibility models | Forrester's argument, summarised; quote only R-53 sentences. |
| L-06, L-07, L-17, L-18, L-20 | Push-to-deploy, instant rollback, previews, Active CPU, Fluid with full Node.js | Confirmed from Vercel docs (V-22, V-25, V-16, V-18; Node, Python, Bun, Rust and Edge runtimes listed; Secure Compute docs list Ruby and Go). L-20 "day-one Next.js features" is Vercel's own claim (R-06). |

## Coverage by theme

| Theme | Fact entries | Opinion entries | Unverified gaps |
|---|---|---|---|
| Competitors / cost / lock-in | R-01 to R-12 | R-15 to R-17 | Render (R-13), OpenShift (R-14), Railway bank fit |
| Sovereignty and regulator | R-20 to R-28 | R-29 | CPS 230 commencement date conflict (R-21); APRA access rights in Vercel's DPA (governance-research §1) |
| Shadow IT | R-11 | R-18, R-19, R-30, R-31 | KPMG 73% figure (R-18) |
| AI risk | R-25, R-26, R-32, R-33 | R-34 to R-36 | Beaver benchmark (R-34); Jev not tested in R-35 |
| Trust and incident record | R-37 to R-39 | R-53 | Customer count affected; infostealer and February start (third-party only) |
| Platform limits and background work | R-40 to R-46 | none | Plan for Workflow, Sandbox labels |
| Support, pauses, debugging | R-47 to R-49 | none | Gartner Peer Insights (L-02) |
| Competitor built-ins | R-50 to R-52 | R-54, R-55 | Forrester placement (R-55) |
