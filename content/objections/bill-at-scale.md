---
id: bill-at-scale
title: Usage-based pricing will blow up our budget
who: CIO
theme: cost-lockin
anchor: underneath
---

## They say
"I've seen the Vercel invoice stories. Per-seat, per-GB, per-everything. What does this cost when everyone uses it?"

## Why they ask
Usage billing is hard to forecast, and a bank budgets in fixed lines.

## Answer
Fair worry. Here is how this app is billed, with the numbers from the pricing page. Functions bill Active CPU only while code runs and pause during I/O, and nothing is charged between requests; memory bills while a request is in flight. This app spends most of its time waiting on the database and the model, which is the cheap shape. In Sydney the rate is $0.180 per CPU-hour against $0.128 in Washington, so pinning to Sydney costs about 41% more per CPU-hour. Pro bandwidth is 1 TB included, then from $0.15 per GB. An internal tool seen by a few dozen investigators won't get near that, and AI Gateway charges provider list price with no markup, with budgets per project. Budgets are soft caps, so set alerts too.

## Show
The deployment card and the per-answer cost readout.

## Don't say
Don't quote a monthly total for this tool. We haven't measured one.

## Sources
- vercel-positioning.md §2 (Active CPU billing) and §6 ("Cost predictability", "AI Gateway is a hidden markup", "Budgets are a hard cap")
- objections-research.md R-01, R-02, R-16
