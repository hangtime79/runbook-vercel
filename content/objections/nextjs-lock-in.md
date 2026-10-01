---
id: nextjs-lock-in
title: We'll be locked in to Vercel
who: CIO
theme: cost-lockin
anchor: connect
---

## They say
"Next.js, OIDC, Connect, the gateway. How do we get out?"

## Why they ask
APRA's letter asks banks for the credibility of portability and exit arrangements. A platform that is easy to enter and hard to leave is a concentration risk.

## Answer
Some of it ports and some of it doesn't, and I'll say which. Ports: the app is standard Next.js and Node, and the AI Gateway works from any environment with an API key, because nothing about it requires deploying to Vercel. Third parties also run Next.js elsewhere through OpenNext, though that's their claim and behaviour parity isn't guaranteed. Doesn't port: Connect mints its tokens through Vercel's identity, so in practice it is Vercel-only, and I found no portability statement. If exit matters, keep the data access behind one interface, which this app does, and treat Connect as the part you'd replace.

## Show
The warehouse card: what Connect is for, and that it's the next step, not built.

## Don't say
Don't say there is no lock-in. Don't promise OpenNext parity.

## Sources
- vercel-positioning.md §6 ("Lock-in")
- governance-research.md §1 (APRA AI letter, vendors; CPG 230) and §7 gap 4
- objections-research.md R-17, R-26
