// All static editorial copy for the redesign lives here, so pipeline/check_story_figures.py can
// read one file. Numbers in these strings are quoted from the analysis; the checker asserts each
// one against parity_reference.json, model_summary.json and data/docs/findings.md.
// Anything that is a live figure (KPI values, chart series, big stats) is computed from data/
// in lib/story.ts and the page components, never typed here.

export const SIDEBAR = {
  brand: "Card Fraud Analysis",
  sub: "Jan – Dec 2017 · 254,224 labeled",
  footerKicker: "Produced by the method",
  footerLines: [
    "Playbook v3.2 · 10 phases · 6 agents",
    "artifacts/ → data/ · read via DuckDB",
    "Next.js · AI SDK · AI Gateway on Vercel",
  ],
} as const;

export const NAV = [
  { href: "/story", label: "Story" },
  { href: "/findings", label: "Key findings" },
  { href: "/patterns", label: "Patterns" },
  { href: "/model", label: "Model" },
  { href: "/explorer", label: "Explorer" },
  { href: "/ask", label: "Ask the data" },
  { href: "/governance", label: "Governance" },
] as const;

export const STORY = {
  kicker: "Analytical brief · Fraud Ops & Risk Strategy",
  title: "One-third of all fraud sits in three places — and one control halves the risk.",
  lede:
    "46 merchants, the $2–$5 micro-transaction band, and cards with a prior authorization in the last hour. " +
    "Signed transactions run at 4.5% fraud versus 10.6% unsigned.",
  railLabel: "Seven findings",
} as const;

export const CLOSER = {
  kicker: "What the model adds",
  title: "A usable risk score, capped by missing signals.",
  body:
    "Transaction-only XGBoost reaches AUC 0.764. The gap to production-grade (0.85–0.90) is device fingerprint, " +
    "IP and 3DS outcome — not in this dataset.",
  model: "Open the model",
  findings: "All recommendations",
  brief: "Read the full brief",
} as const;

export type ChapterSrc = "merchants" | "amount" | "velocity" | "subsector" | "signature" | "age" | "travel";

export const CHAPTERS: readonly {
  src: ChapterSrc;
  short: string;
  owner: string;
  title: string;
  why: string;
  action: string;
  q: string;
  chartTitle: string;
  note: string;
}[] = [
  {
    src: "merchants",
    short: "Merchants",
    owner: "Investigations",
    title: "46 merchants hold 11% of all fraud",
    why: "Sustained fraud above ~25% over hundreds of transactions isn't organic — it signals a compromised terminal, a cloned POS, or a complicit operator.",
    action: "Hand the top-10 merchant IDs to Investigations this week; route their traffic to secondary review.",
    q: "Which merchants have the highest fraud rate?",
    chartTitle: "Top 10 merchants, n ≥ 50",
    note: "Dashed line = 9.47% baseline. All ten run 4–9× over it.",
  },
  {
    src: "amount",
    short: "Micro $2–$5",
    owner: "Rules Engine",
    title: "The $2–$5 band is a card-testing signature",
    why: "Card testers use amounts small enough to dodge threshold rules. Combined with velocity ≥ 1/h the rate hits 77.9%.",
    action: "Deploy amount < $5 AND velocity_1h ≥ 1 → step-up auth. 127 flags in the labeled year at 78% precision.",
    q: "How risky are $2–$5 transactions?",
    chartTitle: "Fraud rate by amount band",
    note: "The U-shape: a spike at $2–$5, a second arm at $1k+ where tested cards are cashed out.",
  },
  {
    src: "velocity",
    short: "Velocity",
    owner: "Rules Engine",
    title: "One prior authorization in the hour more than doubles risk",
    why: "The operational break is at the first repeat, not at 5 or 10. Waiting for v1h ≥ 5 misses 95% of the opportunity.",
    action: "Soft-flag ≥ 1 prior-hour transactions into elevated scoring — escalate when paired with any other signal.",
    q: "Does a recent prior transaction raise fraud risk?",
    chartTitle: "Prior transactions in last hour",
    note: "Rate climbs monotonically; tail groups (3, 4+) are under 30 rows each.",
  },
  {
    src: "subsector",
    short: "Subsectors",
    owner: "Fraud Ops",
    title: "A high-risk five, then a low-risk tail",
    why: "Fungible, online-deliverable goods are where a stolen card yields the most per test. Low-risk sectors are B2B or identity-locked.",
    action: "Route luxury goods and consumer electronics to elevated scoring; de-prioritise flights, restaurants, beauty in review queues.",
    q: "Which merchant categories have the highest fraud rate?",
    chartTitle: "Top 5 vs bottom 5 subsectors",
    note: "The spread is 13.4 points across 38 subsectors.",
  },
  {
    src: "signature",
    short: "Signature",
    owner: "Channels / POS",
    title: "Signature capture is the highest-leverage control",
    why: "81% of transactions carry no signature. SHAP ranks it #3 — the model leans on it across interactions.",
    action: "Audit the unsigned baseline; find signable-but-unsigned channels and fix capture with POS engineering.",
    q: "How does fraud differ between transactions with and without a signature?",
    chartTitle: "Signature provided",
    note: "", // computed from the transaction counts in lib/story.ts
  },
  {
    src: "age",
    short: "Age 65+",
    owner: "Risk Strategy",
    title: "The 65+ segment is protected",
    why: "Likely spending mix — fewer online, high-risk-sector purchases — not intrinsic resistance.",
    action: "No direct action. Calibrate age-conditioned thresholds: a 12% flag on a 65+ customer is a stronger signal.",
    q: "Which age groups see the most fraud?",
    chartTitle: "Fraud rate by age bucket",
    note: "Near-flat until a sharp drop at 65+.",
  },
  {
    src: "travel",
    short: "Travel flag",
    owner: "Rules Engine",
    title: "Impossible-travel flagging is spurious here",
    why: "Card and merchant coordinates are static registry fields; online purchases trigger '1,500 km in 3 minutes'.",
    action: "Deprecate as a rule; reframe as 'registration distance'. Real detection needs device/IP geolocation.",
    q: "Is the impossible-travel flag predictive?",
    chartTitle: "impossible_travel_flag",
    note: "An inverse signal — the flag marks slightly safer traffic.",
  },
];

/** age_bucket 0..4 in features.parquet, in order. */
export const AGE_LABELS = ["<25", "25–34", "35–49", "50–64", "65+"] as const;

export const FINDINGS = {
  kicker: "Phase 5 · Pattern discovery · Pass 1 + Loop 1",
  title: "Where the signal is — and what to do about it",
  lede: "Top five dimensions carry the signal. Everything below rank 7 is noise; the run stopped investing there.",
  varianceTitle: "Variance ranking",
  varianceUnit: "fraud-rate range, pp",
  varianceCaption: "Velocity's 90.9 pp range is a step function: one prior authorization in the hour is the break.",
  typologyTitle: "Typology inventory",
  recsTitle: "Recommendations, ranked by expected impact",
  recsSource: "From the Phase 9 brief",
  triggersTitle: "Triggers fired → features added in Loop 1 (1 of 2 used)",
  triggerCaptions: {
    merchant: "Training-only, recomputed per CV fold",
    both: "cleanest card-testing fingerprint",
  },
} as const;

export const RECOMMENDATIONS = [
  {
    action: "Investigate the 46 merchants above 3× baseline, starting with M_ID_d8ccfbe91b.",
    evidence: "11% of all fraud sits in 0.07% of merchants",
    owner: "Investigations",
  },
  {
    action: "Deploy the $2–$5 × velocity ≥ 1 decline rule.",
    evidence: "77.9% fraud on the combination; 127 flags in the labeled year",
    owner: "Rules Engine",
  },
  {
    action: "Elevate luxury goods & electronics; de-prioritise flights, restaurants.",
    evidence: "14.0% vs 1.0% subsector spread",
    owner: "Fraud Ops",
  },
  {
    action: "Audit the 81% unsigned baseline and fix capture gaps.",
    evidence: "2.3× protection factor when signed",
    owner: "Channels / POS",
  },
  {
    action: "Deprecate impossible_travel_flag as a rule.",
    evidence: "Fires below baseline",
    owner: "Rules Engine",
  },
  {
    action: "Procure device, IP and 3DS signals; rebuild.",
    evidence: "Transaction-only AUC ceiling ≈ 0.78",
    owner: "Data Platform",
  },
  {
    action: "Monthly rolling 90-day merchant-rate review.",
    evidence: "Merchant compromise is the most persistent vector",
    owner: "Fraud Analytics",
  },
] as const;

export const PATTERNS = {
  kicker: "Live from data/golden_record.parquet",
  title: "Fraud patterns",
  lede: "Dashed line on every chart is the 9.47% baseline. Highlighted marks are what to notice.",
  hour: {
    title: "Fraud rate by hour",
    lead: "2–6 AM runs 12.5–18.6%",
    rest: " — about 2× baseline. Midnight itself is low (7.9%).",
  },
  heat: {
    title: "Hour × day of week",
    lead: "Monday 4 AM peaks at 35.1%.",
    rest: " The hot band is 3–4 AM every weekday.",
  },
  category: {
    title: "Merchant category · top 14",
    lead: "A high-risk five",
    rest: " (luxury → gas, all n > 35K) then a cliff to under 4%.",
    caption: "Health care technology tops the list at 18.8% but on only 101 transactions — treat as noise.",
  },
  amount: {
    title: "Amount band",
    lead: "A U-shape with a spike:",
    rest: " $2–$5 is 47.9% fraud — card testing. $1k+ is the extraction arm.",
  },
} as const;

export const MODEL = {
  kickerTail: "diagnostics PASS",
  title: "Detection model",
  lede: "At the operating threshold, one in two flags is real fraud and the model catches 17% of it — before any device, IP or 3DS signal.",
  shapTitle: "What drives a score · mean |SHAP|",
  shapLead: "Merchant history dominates",
  shapRest: " — nearly 2× the next feature.",
  shapCaption:
    "Rare flags (micro, velocity) rank low globally because they fire on under 3% of rows — but drive the most confident predictions.",
  confusionTitle: "Holdout confusion",
  diagnosticsTitle: "§6.5 diagnostics",
} as const;

export const EXPLORER = {
  kicker: "Holdout sample · 500 rows",
  title: "Data explorer",
  note: "Sorted by model score",
  empty: "No rows match. Clear the search or pick another filter.",
} as const;

export const ASK = {
  title: "Ask the data",
  tagline: "Plain question → read-only SQL → answer with evidence",
  helper: "Every answer shows the SQL it ran. Writes are refused.",
  placeholder: "Ask about hours, merchants, amounts…",
  examples: [
    "Which merchant categories have the highest fraud rate?",
    "Is fraud more common at night than during the day?",
    "How does fraud differ between transactions with and without a signature?",
  ],
  steps: ["Writing SQL", "Running on fraud.duckdb (read-only)", "Summarising the result"],
  // Fixed texts: the scope prompt, the scope gate and the output check all use these, word for word.
  refusal: "I can only answer questions about this fraud dataset and its analysis.",
  gateUnavailable: "The scope check is unavailable; try again.",
} as const;

// /intro figures that are quoted from the analysis (the live ones, fraud count and rate, are read from data).
export const INTRO_FIGS = {
  clusterValue: "46",
  clusterLabel: "merchants hold 11% of all fraud",
} as const;
