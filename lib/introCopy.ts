// Static copy for /intro, the demo's opening. Customer wording: "an Australian bank", never a name.
// Figures from the data are read live in app/intro/page.tsx (fraud count, fraud rate) or quoted from
// lib/copy.ts (INTRO_FIGS, covered by pipeline/check_story_figures.py). Platform and APRA claims come
// only from docs/demo/vercel-positioning.md and docs/demo/governance-research.md.

export const INTRO = {
  situation: {
    kicker: "An Australian bank · fraud operations",
    title: "After a fraud wave, the investigators built their own tools. One of them cracked a ring.",
    closer: "This app is one of those tools.",
    labels: { fraud: "confirmed fraud", rate: "fraud rate, labeled transactions" },
  },
  tension: {
    kicker: "The tension",
    title: "Two people in the room, one shared worry.",
    fraud: { role: "Head of Fraud", line: "Keep the speed. My investigators found the ring." },
    cio: { role: "CIO", line: "I keep inheriting apps I didn't build, and I'm accountable for them." },
    apra: {
      label: "APRA",
      // APRA quote: re-check the wording against the APRA PDF before presenting (came via a page summariser).
      quote:
        "The volume and speed of AI assisted software development is placing strain on the effectiveness of change and release management controls.",
      cite: "APRA letter to industry on AI, 30 April 2026",
    },
  },
  thesis: {
    kicker: "The thesis",
    title: "The CIO owns the platform. The fraud team owns the problem. Both are responsible for the apps.",
    sub: "Every app, however it was built, lands on the same rails: identity, review, logging, rollback.",
  },
  see: {
    kicker: "What you'll see",
    title: "Four screens, one app.",
    cards: [
      { key: "story", title: "The fraud team's app", text: "An analysis turned into something the team can act on.", href: "/story" },
      { key: "ask", title: "Ask the data, with evidence", text: "Every answer shows the SQL it ran. It can only read.", href: "/ask" },
      { key: "gov", title: "On the CIO's rails", text: "Who can see it, where it runs, what AI it calls.", href: "/governance" },
      { key: "pr", title: "AI in development, under change control", text: "A change from a coding agent: preview, checks, review.", href: "PR" },
    ],
  },
  tiers: {
    kicker: "Three tiers",
    title: "Everything you'll see runs on Vercel's free tier.",
    sub: "Hobby is the proof it works. Pro makes it a pilot. Enterprise is how a bank runs it in production.",
  },
  start: {
    title: "Start the demo",
    button: "Start the demo →",
    footer: "Built by coding agents from a written runbook · Next.js · AI SDK · AI Gateway · Vercel",
  },
} as const;

/** The Act 3 pull request; set NEXT_PUBLIC_DEMO_PR_URL at build time to link the prepared PR directly. */
export const DEMO_PR_URL =
  process.env.NEXT_PUBLIC_DEMO_PR_URL || "https://github.com/hangtime79/runbook-vercel/pulls";
