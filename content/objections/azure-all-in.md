---
id: azure-all-in
title: We're all-in on Azure with an enterprise agreement
who: CIO
theme: competitor
anchor: underneath
---

## They say
"Our cloud spend is committed to Microsoft. Azure Static Web Apps can host Next.js. Why leave the agreement?"

## Why they ask
Committed spend, one vendor to audit, and a team that already knows Azure. This can be the right call.

## Answer
For a bank that is genuinely all-in on Azure, Azure can be the better fit, and I wouldn't argue it away. Microsoft supports hybrid Next.js on Static Web Apps, but it is documented as a preview, with a 250 MB app limit and a dedicated App Service behind it. This app ships a native DuckDB library, which is the kind of dependency that needs checking against those limits. Vercel's own page says full Next.js feature support lands on Vercel first, and that is vendor framing. My suggestion: pilot the workflow, which is the previews, checks, rollback and gateway, and compare it to what your Azure setup gives an agent-written app today. If Azure matches it, stay.

## Show
The "Vercel underneath" heading: Next.js, a Fluid function running a native engine, the gateway.

## Don't say
Don't say Azure can't run Next.js. Don't claim Azure can't run DuckDB; we haven't tested it.

## Sources
- vercel-positioning.md §3 (Functions / Fluid compute) and §6 ("DuckDB in a function?")
- objections-research.md R-06, R-07, R-15
