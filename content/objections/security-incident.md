---
id: security-incident
title: Vercel was breached this year. Why should we trust it?
who: CIO
theme: trust
anchor: who-sees
---

## They say
"I read about the Vercel incident in April. A third-party AI tool got into their systems. Why would a bank put its apps there?"

## Why they ask
A platform that holds secrets and builds your code is a supply-chain target, and CPS 234 makes the bank answerable for the strength of a third party's controls. A CIO who reads Forrester will have seen the note.

## Answer
It happened, and I would rather say it plainly. Vercel's own bulletin, published 19 April 2026 and updated through 24 April, says a third-party AI tool used by one Vercel employee, Context.ai, was compromised. That let attackers take over the employee's Vercel Google Workspace account and, from there, read the non-sensitive environment variables of a limited subset of customers. Customers had to rotate any variable not marked sensitive, turn on multi-factor authentication, review activity logs and recent deployments, and keep Deployment Protection at Standard or higher. Afterwards Vercel shipped stronger environment-variable defaults, a team-wide security overview of them, and an easier activity log. Forrester's note of 27 April says the old design left it to customers to mark variables sensitive, and that Vercel now defaults them to sensitive, though users can still uncheck it. Two things matter for your risk team. This app signs in to AI Gateway with short-lived OIDC, so no gateway key sits in its environment variables. And my reading, not Vercel's, is that the general lesson is to keep secrets out of any platform's variables and to review which integrations your people connect. The bulletin does not say how many customers were affected.

## Show
The Access card on `/governance`, then the project's environment variable list with no gateway key in it.

## Don't say
Don't say customer secrets were never exposed: non-sensitive variables of some customers were. Don't give a number of affected customers. Don't repeat the infostealer or February details; those come from third parties, not Vercel.

## Sources
- objections-research.md R-37, R-38, R-39, R-53
- vercel-positioning.md §3 (OIDC to gateway)
- verification-2026-10.md V-21
