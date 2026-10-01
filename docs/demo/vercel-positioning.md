# Vercel positioning: research for the demo script

Last verified: 2026-10-01 (every Vercel URL re-fetched; see `verification-2026-10.md`)

Researched 2026-09-30 from vercel.com and vercel.com/docs only (plus Streamlit's docs for the alternative). Nothing from memory. Doc pages carry their own "last_updated" dates (Aug-Sep 2026). Items marked **UNVERIFIED** were not confirmed on a page.

## 1. How Vercel describes itself

| Item | What the page says | Source |
|---|---|---|
| Home headline | "Agentic Infrastructure": infrastructure for "coding agents to ship apps and agents automated by agents" | https://vercel.com |
| Tagline | "Build agents on infrastructure that thinks like them" | https://vercel.com |
| Enterprise | "the enterprise platform for shipping agents and apps" | https://vercel.com/enterprise |
| Ship 2026 (CEO Guillermo Rauch) | "We are deploying software that can think." | https://vercel.com/blog/vercel-ship-2026-recap |
| Products named | eve (agent framework), Passport, Containers, Vercel Connect, Vercel Services, Vercel Agent (public beta), AI SDK 7, AI Gateway, Fluid compute, Sandbox | home; Ship recap |
| AI Gateway | "The AI Gateway for developers"; "Hundreds of models, one API key, no markup. Text, image, video, audio." | https://vercel.com/ai-gateway |

The home page did not use the phrase "AI Cloud"; the current frame is "agentic infrastructure". Do not say "AI Cloud" in the demo without checking.

Published numbers:
- Enterprise page: 8M+ deployments daily, 50B+ requests daily, 5B+ threats mitigated daily, 99.99% uptime SLA, "264% ROI", "90% time saved" managing infrastructure (https://vercel.com/enterprise).
- AI SDK: "over 16 million weekly downloads" (https://vercel.com/blog/ai-sdk-7).
- Ship recap: "Vertex", Vercel's own support agent, "now handles approximately 91% of support tickets and saves roughly 5,000 engineer-hours monthly" (https://vercel.com/blog/vercel-ship-2026-recap). Was: attributed to Vercel Agent; the post names the support agent Vertex. Do not say Vercel Agent does this.
- Home: Notion "millions of agent conversations daily"; Mintlify docs for "over 20,000 companies".

## 2. Differentiators Vercel claims

| Claim (quoted where possible) | Framed against | Source |
|---|---|---|
| AI Gateway "charges no markup and no platform fee on tokens", including BYOK; provider list price | Not named. Gateway pitched vs running "your own proxy, database, and routing control plane" | https://vercel.com/docs/ai-gateway/pricing ; https://vercel.com/docs/ai-gateway |
| Gateway does not need Vercel to run: "nothing about AI Gateway requires deploying to Vercel" | None named | https://vercel.com/docs/ai-gateway/faq |
| Active CPU billing: "you pay for memory whenever work is in progress, never for idle CPU, and nothing at all between requests" | Vercel's Render page contrasts it with "containers on always-on instances that you size yourself" and "per-instance wall-clock billing" | https://vercel.com/docs/functions/usage-and-pricing ; https://vercel.com/kb/guide/docker-on-vercel-vs-render |
| Fluid compute: "a blend of serverless flexibility and server-like capabilities"; avoids "cold starts and limited functionalities" of "traditional serverless" | Traditional serverless | https://vercel.com/docs/fluid-compute |
| Connect: short-lived scoped tokens; "no provider API key ever lives in your environment variables" | Long-lived secrets in vaults: "Putting a token in a vault made it harder to steal, but no less dangerous once stolen. It never expires" | https://vercel.com/docs/connect ; https://vercel.com/blog/the-end-of-credential-sprawl-for-agents |
| OIDC to the gateway: "authenticate your requests to the AI Gateway without needing to manage an API key" | API-key management | https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc |
| Rollback "happens at the routing layer, so it takes effect within seconds" and "without rebuilding" | None named | https://vercel.com/docs/deployments/rollback-production-deployment |
| Enterprise compliance: SOC 2 Type 2, ISO 27001:2022, PCI DSS, HIPAA BAA, TISAX, EU-U.S. DPF; 99.99% SLA | None named | https://vercel.com/docs/security/compliance ; https://vercel.com/enterprise |
| Gateway: "Automatic failover between providers if one degrades"; "Zero Data Retention and no training on customer data" | None named | https://vercel.com/ai-gateway |

## 3. Features this demo can show live

App routes seen in the repo: `/story`, `/brief`, `/findings`, `/patterns`, `/model`, `/explorer`, `/ask` (+ `/api/ask`). The "where in our app" column for infra features is the deployment itself, not a route.

| Feature | What Vercel says (URL) | In our app | Presenter action |
|---|---|---|---|
| **Preview deployments** | Preview created on non-production push, PR, or `vercel` without `--prod`; each gets a branch URL and a commit URL (https://vercel.com/docs/deployments/environments) | Every PR / branch | Push a copy tweak, open the PR-comment URL, show the commit URL vs the branch URL. Comments on previews: only an API note that external logged-in people can comment (https://vercel.com/docs/rest-api/sdk/aliases/update-the-protection-bypass-for-a-url). Toolbar comments not verified. |
| **Deployment Protection** | Controls who can reach preview and production URLs; Vercel Authentication is free, Password Protection $20/project/mo on Pro, Passport and Trusted IPs Enterprise (https://vercel.com/docs/deployment-protection) | Preview URL | Open the preview in a private window, show the Vercel login wall, then sign in. |
| **`vercel curl`** | `vercel curl /api/health --deployment <url>` tests a protected preview (https://vercel.com/docs/deployments/promote-preview-to-production); `--trace` captures a request trace (https://vercel.com/docs/observability) | `/api/ask`, `/api/stats` | `vercel curl /api/stats --deployment <preview>` with no bypass secret; then `vercel curl --trace --json /api/stats`. |
| **Functions / Fluid compute** | Runs on Fluid compute (default for new projects since Apr 23, 2025); Node.js runtime with "complete Node.js compatibility"; bundle limit 250 MB uncompressed, 4.5 MB request/response body cap (https://vercel.com/docs/fluid-compute ; https://vercel.com/docs/functions/limitations) | Native DuckDB in a Node function (`libduckdb.so` via `outputFileTracingIncludes`, per SPEC.md) | Show the function in the dashboard; explain Active CPU: "Waiting for I/O (e.g. calling AI models, database queries) does not count towards active CPU time" (limits page). Text-to-SQL plus a model call is exactly that shape. |
| **AI Gateway** | Providers, failover, budgets, request logs with "every routing attempt"; zero markup (https://vercel.com/docs/ai-gateway) | Model = one env string; three models from three providers compared | Swap the model string, redeploy the preview, run the same `/ask` question. Open Gateway logs to show provider, latency, tokens, cost. Set a project budget live (`vercel ai-gateway budgets set project ...`, https://vercel.com/docs/ai-gateway/observability-and-spend/budgets). |
| **AI SDK 7** | Released 2026-06-25; "over 16 million weekly downloads" (https://vercel.com/blog/ai-sdk-7) | `/api/ask` tool loop with a `query` tool | Show the ~10 lines: `generateText/streamText` with `model: "provider/model"`. Docs example: `model: "anthropic/claude-sonnet-5"` (OIDC page). |
| **OIDC to gateway** | Token auto-generated per project; "only valid for 12 hours" locally, refresh with `vercel env pull`; AI SDK resolves OIDC when `AI_GATEWAY_API_KEY` is unset (OIDC page) | No key in project env vars (SPEC invariant 5) | Show the Vercel env list has no gateway key. Locally, `vercel env pull`, note the 12 h expiry. |
| **Observability / logs** | Logs, traces, metrics from dashboard or CLI; Observability free on all plans, Plus on paid (https://vercel.com/docs/observability) | The function and gateway | `vercel logs --environment production --status-code 500 --json`; open the AI Gateway insight tab. |
| **Instant rollback** | `vercel rollback <url>`; "within seconds"; Hobby only to previous deployment, Pro/Enterprise any (rollback page) | Production | Break a number on purpose in a preview, promote, then roll back. Promote is not instant: "Promoting a preview deployment to production triggers a complete rebuild with production environment variables" (promote page, checked 2026-10-01), so allow build time before the rollback beat. Rollback itself does not rebuild. Rolling Releases (staged traffic %, abort) are documented at https://vercel.com/docs/rolling-releases; they add a billing status check, so confirm plan first. |
| **Vercel Connect + Snowflake** | GA 2026-08-25, all plans (https://vercel.com/changelog/vercel-connect-ga). Snowflake is listed: "Query data through the Snowflake Partner Connect integration"; Vercel-managed OAuth client; "Credentials on demand"; "Vercel OIDC authenticates each runtime request" (https://vercel.com/docs/connect ; https://vercel.com/connect/snowflake). Code path: `getToken('<connector>', { subject: { type: 'app' } })` from `@vercel/connect`. | P3, planned | Show `vercel connect create snowflake`, `vercel connect attach ... --project ... --environment preview`, then the connector's Observability tab (token requests logged). The Snowflake page does not state which token subjects are supported: check before promising `app` vs `user`. |
| **Marketplace** | Provision Neon, Supabase, Aurora Postgres, Redis, Upstash from the dashboard; credentials injected as env vars; unified billing (https://vercel.com/docs/marketplace-storage) | Not used | Optional contrast: Marketplace injects a secret; Connect withholds it. See "cheap additions". |
| **v0** | docs redirect to v0.app/docs; **UNVERIFIED** content | Not used | Skip unless asked. |

**Cheap additions that strengthen the demo**
1. Gateway budget on the demo project: a few CLI lines, then trip it and show the `402 quota_for_entity_exceeded` (budgets page).
2. Gateway request log tab open during the three-model comparison (routing attempts, cost per call).
3. `vercel curl --trace` on `/api/ask`.
4. Passport in place of Vercel Authentication, for the "internal analytics tool behind Okta/Entra" story (https://vercel.com/docs/passport). Enterprise only, so a talking point, not a live demo.
5. Trace Drains to the customer's own tool (https://vercel.com/docs/ai-gateway/pricing): $0.05 per 1,000 traces, Pro/Enterprise.

## 4. Customer proof

Only the Ramp and Notion pages were fetched in full; others come from the customers index or the home page. None of these is a Streamlit-to-Vercel migration or a data-warehouse story. I did not find one.

| Customer | Claim | Relevance | Source |
|---|---|---|---|
| Ramp | "100% uptime and 0% error rates through 100x surges"; used the AI SDK to "build semantic search across disparate internal assets" (was: "scattered") | Finance, AI SDK internal search | https://vercel.com/customers/how-ramp-kept-100-uptime-through-100x-traffic-surges-on-vercel |
| Notion | "Every Notion Worker runs on Vercel Sandbox"; "Credentials never enter the execution environment" | Same "platform owns the credential" argument, on Sandbox | https://vercel.com/customers/notion-workers-vercel-sandbox |
| Searchable | "5x increase in development velocity"; "100+ billion tokens processed"; features shipped "in as little as 30 minutes" | AI app | https://vercel.com/customers/how-searchable-ships-customer-requested-features-in-30-minutes-on-vercel |
| Stably | AI testing agents; "Launch new product lines in hours instead of weeks" (was: cycle time "from weeks to hours"; the page does not use that phrase) | AI app | https://vercel.com/customers/how-stably-ships-ai-testing-agents-in-hours-not-weeks |
| BuildPass (Connect) | "Minting short-lived tokens instead of keeping provider credentials in paused sandboxes has removed a whole class of security risk for us." | Direct Connect quote | https://vercel.com/blog/the-end-of-credential-sprawl-for-agents |
| Moonpig Group (Connect) | "We don't manage tokens, secrets, or event subscriptions ourselves." | Direct Connect quote | same |

Other: Zo Computer, "20x" AI reliability, with "25%" lower latency and "30s" to adopt a new model (https://vercel.com/ai-gateway; case study page not opened).

## 5. Competitive framing

Vercel's own pages (framing is Vercel's, not neutral):
- **vs Render (containers):** Vercel "runs container images as Vercel Functions on Fluid compute... billing only for Active CPU time"; Render "runs containers on always-on instances that you size yourself"; "Workloads with uneven or bursty traffic tend to cost less under Active CPU pricing". Vercel concedes persistence is delegated: containers are "stateless by design" (https://vercel.com/kb/guide/docker-on-vercel-vs-render).
- **vs proxies you run yourself:** the gateway is for teams who want the controls "without operating your own proxy, database, and routing control plane" (https://vercel.com/docs/ai-gateway).
- **vs vaults:** see section 2, Connect.

From Streamlit's docs (official, for the origin story):
- Community Cloud is free and deploys from GitHub repos, "Community Cloud hosts all apps in the United States. This is currently not configurable." (https://docs.streamlit.io/deploy/streamlit-community-cloud ; https://docs.streamlit.io/deploy/streamlit-community-cloud/status). Its resource limits and sleep behavior were not on the pages I fetched: **UNVERIFIED**, do not cite.
- Vercel's own doc says Functions default to the U.S. but can be set to other regions (compliance page). So "region control" is a fair comparison point, but only against Community Cloud, not Streamlit in general.
- Self-hosting on AWS: no official comparison page checked. Vercel's own compliance page says its platform "primarily uses Amazon Web Services". Ship 2026 mentions "Bring Your Own Cloud on AWS (Private Beta)" (was: "beta"). No claim beyond that.

## 6. Gaps and risks

| Pushback | Documented answer | Source |
|---|---|---|
| "AI Gateway is a hidden markup" | Zero markup on tokens including BYOK; but you pay payment-processing fees; add-ons cost extra (custom reporting $0.075 per 1,000 writes; team-wide ZDR $0.10 per 1,000 requests); purchased credits expire after a year | pricing and FAQ pages |
| "Budgets are a hard cap" | No: "a soft cap", the crossing request still completes; BYOK spend is not counted | budgets page |
| "Does Vercel see or keep my prompts?" | AI Gateway does not retain prompt/response content and Vercel does not train on prompts; upstream providers are separate, so use ZDR/allowlists for a guarantee covering the whole path | FAQ |
| "Lock-in" | Gateway works from any environment via API key. Next.js and Node functions are standard. Connect is Vercel-only in practice: tokens are minted via Vercel OIDC (external CI uses a Vercel access token). No portability statement found. | FAQ; Connect page |
| "Cold starts" | Fluid compute: bytecode caching and pre-warming, but "Bytecode caching is only applied to production environments, and is not available in development or preview deployments". Preview timings will look slower than production. | fluid-compute page |
| "DuckDB in a function?" | Bundle limit 250 MB uncompressed; "Large functions" beta up to 5 GB (still beta on the limitations page; changelog 2026-06-29 "Vercel Functions can now be up to 5GB", public beta, new projects enrolled by default, not supported with Secure Compute or Static IPs); single default region `iad1`; 4.5 MB body cap | limitations page |
| "Data residency" | Default Functions region is the U.S., selectable; Pro can pick up to 5 regions (was: 3. The region page says 5; the fluid-compute page still says "Up to 3", so check the dashboard); Vercel "may transfer data... anywhere else in the world"; Gateway offers regional inference (plan requirements on the security page, not read) | compliance page; fluid-compute page |
| "Cost predictability" | Active CPU billing pauses on I/O but memory keeps billing from the first request until the last in-flight request finishes, including time spent waiting on I/O (overlapping requests share the instance); after that "no CPU or memory charges apply until the next invocation" (was: "memory keeps billing for instance life", which overstated it); Pro Active CPU from $0.128/hr (iad1 etc.); Hobby includes 4 h. Connect: $3.00 per 1,000 token requests on Pro; Hobby 500 free | usage-and-pricing; Connect GA |
| "Is Connect production-ready for Snowflake?" | GA, but the Snowflake connector page lists no scopes and no Partner Connect details; treat the P3 story as needing a dry run | connect/snowflake |
| "Preview protection" | Legacy protection options leave production URLs public; Standard Protection covers everything except production domains. Free Vercel Authentication covers "All Deployments". | deployment-protection page |

## Surprises for the presenter
- No "AI Cloud" wording on the home page: it says "Agentic Infrastructure".
- Bytecode caching is not applied on previews, so live cold-start numbers there are worse than production.
- Docs show a trusted-sources bypass: a CI job sends an OIDC token in the `x-vercel-trusted-oidc-idp-token` header to reach a protected deployment (https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/trusted-sources). Only the GitHub Actions example was seen; plan availability not checked.
