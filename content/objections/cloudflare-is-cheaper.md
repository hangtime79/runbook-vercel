---
id: cloudflare-is-cheaper
title: Cloudflare has no bandwidth charges, so isn't it cheaper?
who: CIO
theme: competitor
anchor: kpis
---

## They say
"We looked at Cloudflare Workers: $5 a month and no egress fees. Next.js runs there too."

## Why they ask
Predictable cost, and a vendor they may already use for DNS and the edge.

## Answer
On bandwidth they win, and for a high-traffic public site that matters. Cloudflare lists no charge for data transfer. This tool isn't that: a few dozen investigators reading numbers that are queried from the data at request time. The question is fit. Workers CPU limits are per invocation (10 ms on the free plan), and this page runs a native analytics engine, which needs a full Node.js runtime. Vercel's page on this is vendor framing, so test it, not take my word. If you build a public, bandwidth-heavy site later, run the numbers again.

## Show
The KPI cards: every number read from the data when the page loads.

## Don't say
Don't say Cloudflare can't run this app. We haven't tried it.

## Sources
- vercel-positioning.md §3 (Functions / Fluid compute) and §6 ("DuckDB in a function?")
- objections-research.md R-05, R-06, R-15
