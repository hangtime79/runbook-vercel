---
id: vercel-processes-offshore
title: Pinning to Sydney doesn't mean the data stays in Sydney
who: CIO
theme: sovereignty
anchor: where-runs
---

## They say
"The badge says syd1. Is that a promise that nothing leaves Australia?"

## Why they ask
They have read the terms. Region pinning describes where code runs; they care where data is processed, cached and backed up.

## Answer
It's a promise about where your functions run, and nothing more. Vercel's own compliance page says it may transfer data to and in the United States and anywhere else in the world where it or its service providers process data, and the default Functions region is the U.S. So the region is a setting you own per project, not a residency guarantee. That belongs in your CPS 230 offshoring assessment, and the contract terms are an Enterprise conversation. I'd rather you hear it from me than find it in the DPA.

## Show
The deployment card: region `syd1`, environment, commit.

## Don't say
Don't say "data never leaves Australia". Don't claim failover from `syd1` stays in region.

## Sources
- demo-script.md, "Say it before they do: the gaps", row 2
- governance-research.md §3, rows "Does data stay in-region?" and "Vercel-side control plane"
- objections-research.md R-27
