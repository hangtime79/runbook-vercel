---
id: kpis
title: The KPI cards
act: Act 1
beat: Beat 1.1
route: /story
fast: skip
---

## What
The four KPI cards at the top of the Story: fraud rate, confirmed fraud (of the labeled transactions, with the pending count), holdout AUC and the signature effect. Every figure is computed from the data when the page loads.

## Tell
You are now in the Head of Fraud's app, on the Story page. This is the finished product, so start with what it shows.


## On Vercel
Server components read the data when the page loads, in a Vercel Function pinned to Sydney (`syd1`) next to the data. Active CPU billing means a page nobody is viewing costs nothing. For the bank: numbers are never stale and idle tools are free. *Sources: vercel-positioning.md §2 and §3; governance-research.md §3.*

## Say
This is what your investigators do: turn an analysis into something the team can act on.

Every number is read from the data when the page loads, by a function running in Sydney next to it. And when nobody is looking, it costs nothing: Vercel bills the CPU only while code runs, and nothing between requests.

## Head of Fraud
Investigators turn an analysis into something the team can act on, and the numbers are never stale.

## Show
Open `/story`.

## Craft
Show the outcome first. Land on the finished result before explaining how it was built.
