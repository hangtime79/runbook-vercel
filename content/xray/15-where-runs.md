---
id: where-runs
title: Where it runs
act: Act 2
beat: Beat 2.2
route: /governance
fast: keep
---

## What
The Deployment card on `/governance`: environment, commit and function region, read live from the running deployment.

## Tell
Open `/governance` (an app change). Point at the region `syd1`, the commit and the environment.

## Say
Functions run in Sydney. The default is Washington, so this is a setting you own, per project, not a hope.

## CIO
Region is a per-project setting you own.

## Show
Open `/governance` and point at region `syd1`, commit, environment.

## Craft
Raise the gap before they do. A risk-literate CIO will find it, and saying it first builds trust.

## Watch out
AI Gateway inference regions are US and EU only, and the gateway hop isn't region-pinned yet. Say: "Functions and data run in Sydney. Model calls leave Australia today, with zero retention and no training. For a regulated workload you'd classify the data first. Vercel's docs say region-pinned gateway hosts are coming; no date."

Zero data retention is off on Hobby (`ASK_ZDR=0`); `/governance` shows the real state. On Pro, each request turns it on.

Data may be processed outside Australia (Vercel's compliance page). Say: "That's in the terms; it goes on your CPS 230 offshoring assessment, same as any cloud provider."
