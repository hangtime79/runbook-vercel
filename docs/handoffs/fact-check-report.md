# Fact-check report

**Counts (109 Vercel claims, rechecked 2026-10-01):** 93 confirmed, 14 changed, 0 gone, 2 couldn't load. Table: `docs/demo/verification-2026-10.md`.

## Changed, before → after

- Ship recap 91% of tickets: "Vercel Agent" → Vercel's support agent "Vertex".
- Bring Your Own Cloud on AWS: beta → Private Beta.
- Pro Function regions: 3 → 5 (region page). The fluid-compute page still says 3; check the dashboard.
- Memory billing: "for the life of the instance" → first request to last in-flight request, through I/O waits, nothing between bursts.
- Promote preview to production: implied instant → full rebuild with production variables; only rollback skips it.
- Stripe: "non-engineer in travel time" → "one person in a single flight".
- Stably: "weeks to hours" → "hours instead of weeks"; Ramp "scattered" → "disparate".
- RBAC permission group "Deployment Protection Manager": no longer listed.
- Code owners: "none found" → Enterprise lists Conformance and Code Owners (GitHub; no claim it blocks merges).
- Provider allowlist plan: unstated → $0.10 per 1,000 requests, Pro and Enterprise.
- Gateway budgets: three scopes → four. SIEM "customer KMS": not on the page, dropped.
- Vercel DPA: unread → read. No APRA mention, audit via the SOC 2 report, breach notice "without undue delay", no hours.

**The review's two flags.** The 5 GB limit is not stale: still beta, changelog 2026-06-29. The `bill-at-scale` card was not wrong; the live page agrees with it and VP §6 was the loose one. I added the I/O-wait nuance to the card.

## L-04, in plain words

Real. Vercel's bulletin (19 to 24 April 2026): a third-party AI tool, Context.ai, used by a Vercel employee was compromised. That gave attackers the employee's Vercel Google Workspace account, then the non-sensitive environment variables of a limited subset of customers. Customers had to rotate non-sensitive variables, enable MFA, review logs and deployments. Vercel then shipped stronger variable defaults, a team security overview and an easier activity log. Forrester's note (27 April) says variables now default to sensitive. The customer count is not stated.

## Leads

Confirmed: L-01, L-04, L-06, L-07, L-10 (tools), L-11, L-12 (pauses, support tiers), L-13, L-14, L-15, L-16, L-17, L-18, L-22. Partly: L-03 (inclusion only), L-05, L-08, L-09, L-23. Not confirmed: L-02, L-19, L-21. See `objections-research.md` §E (R-37 to R-55).

## New objections (new `trust` theme)

- security-incident → who-sees
- analyst-view → close-tiers
- support-and-suspension → close-tiers
- long-running-work → underneath
- no-vpc → where-runs
- debugging-black-box → watching
- netlify-built-ins → tension

## Checks

Build, `check_xray.mts`, `check_story_figures.py` and `browser_smoke.mjs` pass. The freshness script passes, and fails on an old or missing date. No "Frontend Cloud" anywhere in content, copy or script.

## Commits (not pushed)

aae17a4 verification and source fixes; 6d4353a research entries; 97bf70c cards and objections; 2d0bd8b freshness script.

<!-- END OF REPORT -->
