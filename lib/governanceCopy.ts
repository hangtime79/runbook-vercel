// Static copy for /governance. Every claim about Vercel here comes from docs/demo/vercel-positioning.md
// or docs/demo/governance-research.md; values the app can know (region, commit, limits, models) are
// read live in app/governance/page.tsx and never typed here.

export const GOVERNANCE = {
  kicker: "Inventory card · this app only",
  title: "Governance",
  lede:
    "What this app is, where it runs, what data it can touch, what AI it calls, and what stops a bad change. " +
    "Values marked live are read from the running deployment; values marked configured are set in the Vercel " +
    "project or GitHub and the app cannot detect them.",
  access: {
    title: "Access",
    value:
      "Production is open to anyone with the link, on purpose, so the demo can be shared. Every preview of every " +
      "change sits behind Vercel Deployment Protection (Vercel login, team members only). One project setting, " +
      "All Deployments, puts the same login in front of production.",
    basis: "configured, not detected",
    note: "Enterprise adds Passport, which puts the organisation's own identity provider (Entra, Okta) in front of the deployment.",
  },
  ai: {
    credential: "Vercel OIDC to AI Gateway. No API key is stored in the project's environment variables.",
    credentialBasis: "configured (SPEC invariant 5)",
    can: "Reads data, shows the SQL it ran, and cannot write.",
    scope:
      "Every question is checked by a separate evaluation model before the answering model sees it; answers are " +
      "checked before they are shown. If the check cannot run, the question is refused: it fails closed.",
    zdrOn:
      "Zero data retention and no prompt training are requested on every model call. A model with no ZDR-capable " +
      "provider fails the request; it is never routed around.",
    zdrOff:
      "Zero data retention is OFF in this environment (ASK_ZDR=0). The AI Gateway rejects the option for a team on " +
      "the Hobby plan; this is a local-development setting, not the deployed configuration.",
  },
  changeControl: {
    title: "Change control",
    lede: "A change to this app is held by these checks. They run without secrets and never call the AI Gateway.",
    workflowPath: ".github/workflows/checks.yml",
    checks: [
      { name: "Build", what: "The app compiles from a clean install." },
      { name: "Numbers match source data", what: "Every figure the app serves equals the parity reference to 1e-9." },
      { name: "Copy figures trace to data", what: "Every number typed into the copy is found in the analysis outputs." },
      { name: "Read-only guard rejects writes", what: "DELETE, multi-statement, ATTACH and COPY … TO are refused; a SELECT runs." },
      { name: "Ask headline step", what: "The Ask route's tool loop runs against a mock model." },
      { name: "Scope gate blocks off-topic questions", what: "An out-of-scope question is refused without the answering model being called; a failed check refuses too." },
    ],
    note:
      "Branch protection on main (required checks plus one review) is a GitHub setting; Vercel does not enforce " +
      "human approval. Vercel Deployment Checks can hold a production promotion until the same checks pass.",
  },
  tiers: {
    title: "Plan tiers",
    lede:
      "This deployment runs on the free Hobby plan: the left column is live here. Pro adds the controls a pilot " +
      "needs; Enterprise adds what a regulated bank needs to run it in production.",
    note: "Only the Hobby column is running in this deployment. The Pro and Enterprise columns are what each plan adds.",
  },
  apra: {
    title: "APRA mapping",
    note: "Quotes checked against the APRA source documents.",
    rows: [
      {
        source: "AI letter, 30 Apr 2026 · change control",
        asks: "Change and release controls strained by AI-generated code; security testing of AI code.",
        shows: "PR → protected preview → required checks → human review → Deployment Checks → rollback.",
      },
      {
        source: "AI letter · identity",
        asks: "IAM not adjusted to non-human actors.",
        shows: "OIDC gateway auth with no stored key; Connect short-lived tokens (next).",
      },
      {
        source: "AI letter · inventory, oversight",
        asks: "Inventory of AI tooling and use cases; human involvement for high-risk decisions.",
        shows: "Gateway logs per project and model; this page; the AI only reads and shows evidence.",
      },
      {
        source: "AI letter · vendors",
        asks: "Concentration; substitution, portability, exit.",
        shows: "Provider allowlist; three providers tested on the same questions.",
      },
      {
        source: "CPS 234",
        asks: "Controls commensurate with criticality; third-party assurance; 72-hour incident notification.",
        shows: "Deployment Protection, roles, audit logs (Enterprise); SOC 2 Type 2, ISO 27001:2022 and PCI DSS via the Trust Center.",
      },
      {
        source: "CPS 230",
        asks: "Material service providers; tolerances; business continuity; contract access rights.",
        shows: "99.99% SLA (Enterprise); rollback in seconds; function failover regions (Enterprise). Contract terms are an Enterprise sales conversation.",
      },
    ],
  },
  gaps: {
    title: "Gaps, stated plainly",
    rows: [
      {
        gap: "Model calls leave Australia",
        text:
          "AI Gateway inference regions are US and EU only, and the gateway hop is not region-pinned yet. Functions and " +
          "data run in Sydney; prompts (schema, sample rows, results) go to providers in the US, EU or globally, with zero " +
          "retention and no training.",
      },
      {
        gap: "Data may be processed outside Australia",
        text: "Vercel's compliance page says data may be transferred anywhere its service providers operate. It belongs on the CPS 230 offshoring assessment.",
      },
      {
        gap: "Most governance controls are Enterprise",
        text: "Audit logs, SIEM drain, Directory Sync, Passport and Secure Compute. A Pro pilot proves the workflow; those controls come with Enterprise.",
      },
    ],
  },
} as const;
