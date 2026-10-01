---
id: evidence
title: The Evidence card
act: Act 1
beat: Beat 1.2
route: /story
fast: keep
panel: yes
stand_in: delete-refused
appears_after: 10
---

## What
The Evidence card under every answer: the SQL it ran, the result rows, `SELECT only`, and `fraud.duckdb · opened read-only`.

## Tell
Point at the checklist, the headline stat, and then the Evidence card.


## On Vercel
The Vercel Function runs the SQL against a read-only database file, and the AI Gateway logs the call (model, tokens, cost) per project. For the bank: every answer carries its own evidence, and the platform keeps a second record of the call. *Sources: demo-script.md, Beat 1.2 and Beat 2.4; vercel-positioning.md §3, "Observability / logs".*

## Say
An investigator who doesn't write SQL gets an answer with its evidence attached. They can trust it, or hand it to an analyst to check.

## Head of Fraud
An investigator who doesn't write SQL still gets the evidence, and an analyst can check it.

## Show
Point at the SQL it ran, the rows, and "opened read-only".

## Craft
Show the evidence, not just the answer. The audience can check the claim for themselves.
