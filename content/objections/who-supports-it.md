---
id: who-supports-it
title: When an investigator's app breaks at 3am, who is on call?
who: CIO
theme: shadow-it
anchor: change-propose
---

## They say
"The fraud team builds it, IT inherits it. Who supports it when it matters?"

## Why they ask
Ownership gets fuzzy once a tool becomes essential. They have seen creators left holding something the bank depends on.

## Answer
The thesis answers it: the CIO owns the platform, the fraud team owns the problem, both are responsible for the app. In practice that means every change, from an investigator, a coding agent or v0, goes through a pull request, a private preview and your required checks before production, and any bad release rolls back in seconds without a rebuild. The platform part is theirs to run on one set of rails. Who is on call for a given app is a decision for you to write down. Vercel has no page on adopting apps built outside IT, so I can't point to a feature for that.

## Show
The change-control card: the PR, the checks, rollback.

## Don't say
Don't say Vercel handles support ownership. It doesn't.

## Sources
- demo-script.md, "The room" (thesis), Act 3
- governance-research.md §5 ("Governing citizen apps") and §7 gap 9
- objections-research.md R-18, R-19, R-30
