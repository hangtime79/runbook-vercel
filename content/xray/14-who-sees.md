---
id: who-sees
title: Who can see it
act: Act 2
beat: Beat 2.1
route: /governance
fast: keep
---

## What
The Access card on `/governance`: who can open the app, with the Enterprise option underneath.

## Tell
Turn to the CIO. This is the question you'd ask when the app lands on your desk, and Act 2 answers it in four parts: who can see it, where does it run, what AI does it call, and who's watching.


## On Vercel
Deployment Protection: Vercel Authentication covers every deployment, previews included, on all plans. On Enterprise, Passport puts your own identity provider in front of it, with SSO, Directory Sync, Access Groups and an Enterprise Viewer role. For the bank: nobody outside the team reaches any preview of any change. *On the other side of the bridge: the project's Deployment Protection settings. Source: governance-research.md §2.*

## Say
Now the question you'd ask when this lands on your desk: who can see it, where does it run, what AI does it call, and who's watching?

Nobody outside the team gets in, including to every preview of every change. On Enterprise, **Passport** puts your own identity provider (Entra, Okta) in front of it, with group claims the app can read.

including an *Enterprise Viewer* role Vercel describes as ideal for compliance officers and auditors.

## CIO
Oversight of who can see each app, and each preview of each change. SSO, Directory Sync, Access Groups and roles are the Enterprise controls behind it.

## Leave the app
Open the app URL in a private window and show the Vercel login wall.

## Craft
Start the act with the CIO's own four questions, then answer them in order.

## Watch out
Most governance controls are Enterprise (audit logs, SIEM drain, Directory Sync, Passport, Secure Compute). That is not a gap, it's the tier story: "What you saw runs on the free tier: that's the proof. Enterprise is the production tier, with the controls APRA will ask you to evidence."
