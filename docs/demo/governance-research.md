# Governance research: APRA, Vercel controls, AI oversight

Last verified: 2026-10-01 (Vercel URLs re-fetched; see `verification-2026-10.md`). APRA quotes and paragraph numbers: checked against the APRA PDFs by Grant, recorded 2026-10-02.

Researched 2026-09-30 from apra.gov.au, vercel.com, vercel.com/docs and v0.app only. Extends `vercel-positioning.md`; does not repeat it. Vercel doc pages carry "last_updated" dates of Jun-Sep 2026.

**Caveats.** (a) APRA quotes below first came back through the fetch tool's page summariser; Grant has since checked wording and paragraph numbers against the PDFs (recorded 2026-10-02). (b) Nothing found on vercel.com mentions APRA, CPS 230 or CPS 234 (searched). Items not confirmed on a page are marked **UNVERIFIED**.

## 1. APRA obligations that bite here

| Source | Requirement | Quote | Evidence a platform could supply |
|---|---|---|---|
| **CPS 230** Operational Risk Management. https://www.apra.gov.au/standards/cps-230 ; dates: https://www.apra.gov.au/consultation/operational-risk-management | In force 1 July 2025. Pre-existing provider contracts transition "until the earlier of renewal or 1 July 2026" (page paraphrase, already past today). | "Material service providers are those on which the entity relies to undertake a critical operation or that expose it to material operational risk." (para 49 per page) | A register-ready description of Vercel as a service provider; sub-processor list. **UNVERIFIED** on Vercel side. |
| CPS 230, critical operations and tolerances | Bank sets tolerance levels per critical operation (max outage, max data loss, minimum service). ADIs must treat "payments, deposit-taking and management, custody, settlements and clearing" as critical. | "the maximum period of time the entity would tolerate a disruption... the maximum extent of data loss... minimum service levels" (para 39) | Vercel: 99.99% SLA (Enterprise page, see positioning), 2-hourly backups kept 30 days, but "not available to customers" (compliance page). Fraud investigation apps are probably not critical operations; the bank decides. |
| CPS 230, business continuity | BCP with triggers, dependencies, and "a systematic testing program... includes an annual business continuity exercise" (para 44) | as quoted | Vercel: rollback "within seconds" (positioning); multi-AZ functions by default; Enterprise function failover regions (https://vercel.com/docs/functions/configuring-functions/region); "recurring resiliency testing" (https://vercel.com/docs/security/compliance). |
| CPS 230, contracts | Contract must "Allow APRA access to documentation, data and any other information... allow APRA the right to conduct an on-site visit" (para 55); notify sub-contracting (para 54); notify APRA before "material offshoring" (para 60) | as quoted | Vercel DPA (https://vercel.com/legal/dpa), read 2026-10-01: no mention of APRA or financial regulators; audit rights are met by giving the customer the latest Audit Report (SOC 2 Type 2), "Vercel will make available to Customer a copy of Vercel's most recent Audit Report"; no on-site visit right found. Was: not read. |
| **CPS 234** Information Security. https://www.apra.gov.au/standards/cps-234 | Classify assets by "criticality and sensitivity" (para 20); controls "commensurate with" that (21); assess third-party capability (16); independent testing (29); internal audit covers third-party controls (32) | "no later than 72 hours, after becoming aware of an information security incident" (para 35) | Vercel: SOC 2 Type 2 (Security, Confidentiality, Availability), ISO 27001:2022, PCI DSS AOC via https://security.vercel.com ; pen tests by third parties (compliance page). |
| **CPG 230** (guidance). https://www.apra.gov.au/practice-guides/cpg-230 | Concentration, exit, sub-outsourcing | "risks associated with geographic location or concentration of the service provider(s)"; "ensure it can conduct an orderly exit" | Portability: AI Gateway "nothing about AI Gateway requires deploying to Vercel" (positioning); Connect is Vercel-only in practice. |
| **Cloud guidance** | APRA rescinded its 2018 cloud information paper on 19 Feb 2025: CPS 230 "now provides the necessary supervisory framework". https://www.apra.gov.au/news-and-publications/apra-rescinds-information-paper-cloud-outsourcing-and-ceases-ad-hoc-credit | No separate cloud rulebook to cite; CPS 230 and CPS 234 carry it. | n/a |
| **AI letter to industry**, 30 Apr 2026. https://www.apra.gov.au/news-and-publications/apra-letter-industry-artificial-intelligence-ai | Based on late-2025 engagement with large banks, insurers, super funds. Expects AI governance to be operational. | "While most entities recognise that existing prudential standards apply to AI risk, few have operationalised governance in practice." Names no standard. | See below. |
| AI letter, development | AI-generated code strains change control | "The volume and speed of AI assisted software development is placing strain on the effectiveness of change and release management controls." Expects "robust security testing across AI-generated code, software components and libraries". | PR + preview + required checks trail (section 5). |
| AI letter, identity | | "Identity and access management capabilities have not yet adjusted to nonhuman actors such as AI agents." | OIDC-only gateway auth (no stored key), Connect short-lived tokens, per-key/project log attribution. |
| AI letter, inventory and oversight | | "an inventory of AI tooling and AI use cases"; "human involvement for high-risk decisions and accountability" | Gateway request logs by project/key/model (section 4). Inventory itself is the bank's job. |
| AI letter, vendors | | "active management of concentration risk... the credibility and feasibility of substitution, portability or exit arrangements"; embedded AI makes "upstream dependencies such as foundation models, training data sources and fourth party service providers... opaque" | Gateway provider allowlist + model routing lets a bank show substitution; the gateway is itself a new dependency. |
| AI letter, monitoring | | Monitoring "continuous and proportionate to the criticality of the use case" | Trace Drains to the bank's own tool (positioning). |
| Board press release, 30 Apr 2026: https://www.apra.gov.au/news-and-publications/apra-calls-step-change-ai-related-risk-management-and-governance | Boards lack technical depth to challenge AI risk | "The systems and processes required to safely govern its use aren't keeping up." (Therese McCarthy Hockey) | n/a |

Useful framing: APRA says fraud and scam disruption is already an AI use case in the sector (letter, per search excerpt).

## 2. Vercel governance and control features

| Control | What the page says | Plan | URL |
|---|---|---|---|
| SAML SSO | Okta, Entra, Google, Ping, many more; enforceable ("cannot access any team information" unless SAML session); session 1-30 days | Enterprise; Pro via paid add-on | https://vercel.com/docs/saml |
| Directory Sync (SCIM-style) | Provisioning and de-provisioning from the IdP; IdP groups map to roles and Access Groups. Page never says "SCIM": **UNVERIFIED** protocol. | Enterprise only | https://vercel.com/docs/directory-sync |
| RBAC | Team roles: Owner, Member, Developer, Security, Billing, Pro Viewer, Enterprise Viewer, Contributor. Project roles: Admin, Developer, Viewer (Contributors only). "Enterprise Viewer... ideal for compliance officers, auditors". Permission groups (Create Project, Full Production Deployment, Usage Viewer, Connector Manager, Environment Manager, Environment Variable Manager; was: "Deployment Protection Manager", which is no longer listed. The Security role manages Firewall, Rate Limiting and Deployment Protection) | Roles vary; Enterprise Viewer Enterprise; Developer role on Pro | https://vercel.com/docs/rbac/access-roles |
| Access Groups | Bundle projects plus project roles; map to directory groups | Enterprise (GA per changelog title) | https://vercel.com/docs/rbac/access-groups |
| Audit logs | Owner-only; CSV export (link valid 24 h); events include env var create/update/delete, protection changes, role changes, `passport-access-granted`. Retention period **not stated on the page**. | Enterprise | https://vercel.com/docs/audit-log |
| SIEM | "Audit Log Drains" to S3, Splunk, Datadog, Panther, or any HTTP endpoint; replaces "Custom SIEM Log Streaming" (which listed S3, Splunk, Datadog, Google Cloud Storage). The "customer KMS" detail from the first pass is not on the page and is dropped | Audit Log Drains Enterprise only; other drains Pro and Enterprise ($0.50 per GB) | https://vercel.com/docs/drains |
| Deployment Protection | Vercel Authentication (all plans), Password ($20/project/mo Pro), Passport and Trusted IPs (Enterprise). "Standard Protection" leaves production domains open; "All Deployments" protects them. Team-wide defaults | as listed | https://vercel.com/docs/deployment-protection |
| Passport | Sign in with your own IdP (Entra, Okta, any OIDC) before viewing a deployment; group claims; identity readable in app code; Enterprise price on request | Enterprise | https://vercel.com/docs/passport |
| Deployment Checks | Production build held until required GitHub Actions/integration checks pass; "Force Promote" bypasses. Plan not stated: **UNVERIFIED**. | ? | https://vercel.com/docs/deployment-checks |
| Merge rules / code owners | Was: none found. The Enterprise plan page lists **Conformance** (static analysis rules and allowlists) and **Code Owners for GitHub** (owners files, `.vercel.approvers` Code Approvers who can review and accept pull request changes). Code Owners works with GitHub and the page does not say it blocks a merge; branch protection itself lives in GitHub, which v0 respects (section 5). | Enterprise | https://vercel.com/docs/plans/enterprise ; https://vercel.com/docs/code-owners |
| Env vars | Sensitive vars unreadable after creation (preview and production only); build-log redaction; team policy "Enforce Sensitive Environment Variables". Plan **UNVERIFIED** | ? | https://vercel.com/docs/environment-variables/sensitive-environment-variables |
| Network | Secure Compute: dedicated VPC, static IPs, VPC peering, VPN; Enterprise; you pick a Function region. Static IPs (shared): Pro/Enterprise, $100/mo per project. Neither covers Edge runtime or Routing Middleware. | Enterprise / Pro+ | https://vercel.com/docs/networking/secure-compute ; https://vercel.com/docs/networking/static-ips |
| Vercel Agent | Code Review, Investigations, chat; "read-only by default"; writes need an approved plan. Public beta. "never trains on customer code if your... data preferences setting is 'off' or you are on an Enterprise plan". Token pricing plus $0.25/M tokens | Pro and Enterprise (beta) | https://vercel.com/docs/agent ; https://vercel.com/docs/agent/pr-review |
| Firewall/WAF | Security role manages "Firewall, Rate Limiting, Deployment Protection". Feature detail not fetched | **UNVERIFIED** | https://vercel.com/docs/rbac/access-roles |
| Spend management | Alerts at 50/75/100%; optional pause of production. Pausing "does not stop AI Gateway API key usage or v0 usage" | Pro; Enterprise on Flexible Commitment | https://vercel.com/docs/spend-management |
| Financial-services material | No banking page found. Trust Center holds SOC 2, ISO, PCI AOC; PCI is shared responsibility | | https://security.vercel.com |

## 3. Region and data residency

| Question | Answer | URL |
|---|---|---|
| Sydney compute region? | Yes: `syd1` (ap-southeast-2), one of 19 compute regions; 126 PoPs | https://vercel.com/docs/regions |
| Default | Functions run in `iad1` (Washington, D.C.) "for all new projects" | https://vercel.com/docs/functions/configuring-functions/region |
| Pin | `"regions": ["syd1"]` in `vercel.json`, per-function override, or `vercel --regions syd1`. Limits: Hobby 1, **Pro 5**, Enterprise all. (`vercel-positioning.md` said Pro 3: the current page says 5.) Enterprise adds `functionFailoverRegions` | same |
| Does data stay in-region? | Not promised. "Vercel may transfer data to and in the United States and anywhere else in the world where Vercel or its service providers maintain data processing operations." Failover priority from `syd1` is not listed; the `iad1` chain ends P16 `syd1` | https://vercel.com/docs/security/compliance |
| CDN caching | Static content is cached in PoPs "closest to" users, so cached responses can sit outside Australia. Whether cached dynamic responses can be kept in-region is **UNVERIFIED** | region page |
| Vercel-side control plane | "core database and data plane is a globally replicated database" (compliance page). Location **UNVERIFIED** | compliance page |
| AI Gateway regional inference | Only `us` and `eu`. **No Australia or APAC.** Default `global`: "may be outside your users' jurisdiction. Residency is opt-in". If it cannot honour the region, HTTP 400, no silent fallback. Regional prices run higher (about 10% per changelog). Plan requirement not stated on the page: **UNVERIFIED** | https://vercel.com/docs/ai-gateway/security-and-compliance/regional-inference ; https://vercel.com/changelog/regional-inference-now-available-on-ai-gateway |
| Gateway hop | "inferenceRegion... doesn't pin where your request reaches AI Gateway: your request can terminate and be processed in any Vercel region". "Region-pinned gateway hosts... are coming." | regional-inference page |
| Connect / Snowflake | No residency or region statement (page only says credentials are requested on demand) | https://vercel.com/connect/snowflake ; https://vercel.com/docs/connect |

## 4. AI governance at the gateway

| Control | Detail | Plan/cost | URL |
|---|---|---|---|
| Provider allowlist | Team-wide; "A developer on the team cannot route traffic to a provider the org hasn't approved." Provider level, "not by model". Published 28 May 2026 | Team-wide allowlist: $0.10 per 1,000 successful requests, Pro and Enterprise (was: not stated; per-request `only` filter is free on all plans) | https://vercel.com/changelog/team-wide-provider-allowlist-on-ai-gateway |
| Model deny/rewrite rules | "Routing rules are firewall-style rules that control which models your team can use, applied at the gateway level"; deny returns 403; apply to "every request made with your team's AI Gateway credentials". Beta. `vercel ai-gateway rules add --type deny --source <model>` | not stated | https://vercel.com/changelog/ai-gateway-routing-rules |
| ZDR | Per-request `zeroDataRetention: true` free; team-wide toggle $0.10 per 1,000 requests; both Pro/Enterprise. Team-wide overrides request-level false. No ZDR provider means request fails. `anthropic/claude-fable-5` has no ZDR on any provider (30-day retention) | as stated | https://vercel.com/docs/ai-gateway/security-and-compliance/zdr |
| No training | "available to all AI Gateway users at no extra charge"; not enforced on BYOK requests | free | https://vercel.com/docs/ai-gateway/security-and-compliance/disallow-prompt-training |
| Vercel's own retention | "AI Gateway has a ZDR policy and does not retain prompts, outputs, or sensitive data." Abuse/safety retention by providers can sit outside the pinned region | | zdr and regional-inference pages |
| Request logs | Team and project scope, filter by model/provider/key, CSV/JSON export. Routing detail kept **30 days**; look-back at most 36 days. Longer needs Observability Plus. Trace Drains forward per-request traces | Observability free; Plus paid | https://vercel.com/docs/ai-gateway/observability-and-spend/logs |
| Budgets | Team/project/API key/user, with defaults for project, key and user (was: team/project/key); soft cap per positioning; BYOK spend excluded | | https://vercel.com/docs/ai-gateway/authentication-and-byok/byok |
| BYOK | Team-scoped; needs purchased credits; falls back to Vercel system credentials on failure; skipped under ZDR unless key marked ZDR | paid tier | same |
| Restrict which models apps call | Provider allowlist plus model deny rules, both team-wide, set outside app code. Per-app model allowlist not found: **UNVERIFIED**. A `guardrails` permission exists in the API schema; docs not found |  |  |

## 5. AI in development

| Topic | Finding | URL |
|---|---|---|
| v0 positioning | "an AI agent that helps anyone create real code and full-stack apps and agents"; audience list includes product managers, designers, data scientists, customer support, marketing. Apps deploy "to secure, scalable infrastructure powered by Vercel", one click, or "open a pull request for review" | https://v0.app/docs |
| Citizen-built customer proof | Stripe: "achieved by one person in a single flight" (was: "complete app built by non-engineer in travel time"; the page does not say non-engineer); Avalara; Code and Theory (75% faster prototype) | https://vercel.com/customers/industries/finance |
| v0 Enterprise | SSO via Directory Sync and Access Groups; roles v0 Builder/Creator/Viewer; "Restrict Chat Sharing"; owners can access all team chats; custom-model toggle. Fetch reported no detail on training, data policy or deploy location: **UNVERIFIED** | https://v0.app/docs/enterprise |
| v0 to GitHub | Working branch per chat; PR created; "Each working branch gets its own Vercel preview deployment"; "required checks, required reviews, draft pull requests, and other branch protections can block the merge" | https://v0.app/docs/github |
| v0 exposure | "No chats are ever deployed without actively sharing them"; unprotected `*.vercel.app` URLs are "public and indexable" | https://vercel.com/kb/guide/locking-down-deployments |
| Governing citizen apps | No Vercel page found on discovering or adopting apps built outside IT. Levers are team-wide protection defaults, sensitive-env policy, provider allowlist and Access Groups. This is inference, not a Vercel claim | |
| Code Review | Runs on PR open and on pushes; uses the whole codebase; validates patches in a Sandbox with your builds/tests/linters; reads `AGENTS.md`/`CLAUDE.md`; `@vercel run a review`. Public beta | https://vercel.com/docs/agent/pr-review |
| Agent-built change flow | Agent or v0 pushes branch, PR, preview (behind Deployment Protection), GitHub required checks, Deployment Checks before production promote, rollback. This maps to APRA's change-control concern. Vercel does not say it enforces human approval on merge; that is GitHub branch protection | deployment-checks page |

## 6. Customer proof

| Customer | Claim | URL |
|---|---|---|
| Neo Financial (Canadian digital bank) | 50% less infrastructure admin, 77% faster page load; "Our core business is banking and financial services". Dated 22 Jun 2023 | https://vercel.com/blog/neo-financial |
| Ramp (US finance) | 100% uptime through 100x surges (see positioning) | https://vercel.com/customers/how-ramp-kept-100-uptime-through-100x-traffic-surges-on-vercel |
| Stripe, Avalara | v0-built internal/GTM tools | finance customers page above |

**None Australian or ANZ. No APRA-regulated bank, no card issuer, no fraud use case found.**

## 7. Gaps a CIO or risk officer would raise

1. **No Australian inference region** for AI Gateway. Text-to-SQL prompts (schema, sample rows, results) go to `us`, `eu` or global providers. A `syd1` function does not change that.
2. **Gateway and control plane location unpinned.** "any Vercel region"; data may move "anywhere else in the world".
3. **No APRA-specific material.** No CPS 230 mapping, no APRA access/audit rights in the DPA (read 2026-10-01: audit via the SOC 2 Audit Report only, breach notice "without undue delay" with no hours), sub-processor list is public at security.vercel.com. All three are contract questions for Enterprise sales.
4. **Concentration and exit.** Vercel runs "primarily" on AWS; Connect is Vercel-only; gateway adds a provider layer. APRA's letter asks for tested substitution.
5. **Governance features mostly Enterprise-only** (audit logs, SIEM drain, Directory Sync, Passport, Secure Compute). A Pro pilot will not show them.
6. **Audit retention** for audit logs is unstated; gateway routing detail is 30 days. CPS 234 internal audit and 72-hour incident reporting need the bank's own SIEM copy.
7. **Soft controls.** Budgets are soft caps; spend pause does not stop gateway or v0 spend; Force Promote bypasses Deployment Checks; Standard Protection leaves production public.
8. **Several controls are beta or plan-unclear**: routing rules, Vercel Agent, allowlist, sensitive-env policy, deployment checks.
9. **Shadow-app governance** for citizen builders is not addressed in any Vercel page found.
10. **No local proof.** No Australian bank or fraud reference; the only bank case is a 2023 Canadian one.
