// The intro deck's words live in content/intro/*.md (edit those; see content/README.md). Figures from the
// data are read live in app/intro/page.tsx (fraud count, fraud rate) or quoted from lib/copy.ts
// (INTRO_FIGS, covered by pipeline/check_story_figures.py). What stays here is wiring, not wording.

/** The Act 3 pull request; set NEXT_PUBLIC_DEMO_PR_URL at build time to link the prepared PR directly. */
export const DEMO_PR_URL =
  process.env.NEXT_PUBLIC_DEMO_PR_URL || "https://github.com/hangtime79/runbook-vercel/pulls";
