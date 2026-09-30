// The three-tier table from docs/demo/demo-script.md ("Three tiers"), one source for /intro and
// /governance. Every claim comes from docs/demo/vercel-positioning.md or governance-research.md.
// Kept out of lib/copy.ts on purpose: these are platform claims (plan limits, SLA), not figures from
// the fraud data, so pipeline/check_story_figures.py has nothing to trace them to.

export type Tier = "hobby" | "pro" | "enterprise";

export const TIER_COLUMNS: readonly { id: Tier; name: string; heading: string }[] = [
  { id: "hobby", name: "Hobby", heading: "Live today on Hobby (free)" },
  { id: "pro", name: "Pro", heading: "Pro adds (a pilot)" },
  { id: "enterprise", name: "Enterprise", heading: "Enterprise adds (APRA-grade production)" },
];

export const TIER_ROWS: readonly { topic: string; hobby: string; pro: string; enterprise: string }[] = [
  {
    topic: "Who can open it",
    hobby: "Vercel login on every deployment",
    pro: "Password protection; team roles and seats",
    enterprise:
      "Passport: your own IdP (Entra/Okta) in front of every app; SAML SSO enforced, Directory Sync, Access Groups, Enterprise Viewer role for auditors",
  },
  {
    topic: "Where it runs",
    hobby: "Functions pinned to Sydney (syd1, verified)",
    pro: "Up to 5 regions",
    enterprise: "Function failover regions; Secure Compute (dedicated VPC, peering, VPN)",
  },
  {
    topic: "What AI it calls",
    hobby: "AI Gateway: OIDC (no stored key), no training on prompts, request logs",
    pro: "Per-request zero data retention; spend management",
    enterprise: "Audit logs and Audit Log Drains to Splunk/Datadog/S3 for your SIEM and CPS 234 audit",
  },
  {
    topic: "Change control",
    hobby: "Preview per change; required GitHub checks; rollback to the previous deployment",
    pro: "Rollback to any deployment",
    enterprise: "99.99% SLA, and the contract conversation CPS 230 needs (APRA access rights, offshoring)",
  },
];

/** This deployment runs on the free plan; the /governance card marks it. */
export const THIS_DEPLOYMENT_TIER: Tier = "hobby";
