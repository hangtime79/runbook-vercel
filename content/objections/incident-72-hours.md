---
id: incident-72-hours
title: If something goes wrong at Vercel, how do we meet the 72-hour rule?
who: CIO
theme: sovereignty
anchor: who-sees
---

## They say
"CPS 234 gives us 72 hours to tell APRA. What do I get from you to do that, and who can I audit?"

## Why they ask
They need logs they hold themselves, a way to prove who had access, and assurance about a third party's controls.

## Answer
Two parts. First, assurance: Vercel holds SOC 2 Type 2 (Security, Confidentiality, Availability), ISO 27001:2022 and PCI DSS, with the reports in the Trust Center, and runs third-party penetration tests. That feeds your assessment of the provider's capability. Second, evidence you keep: on Enterprise, audit logs record changes to protection, env vars and roles, and Audit Log Drains send them to your Splunk, Datadog or S3. The retention period of Vercel's own audit log isn't stated on its page, so the copy in your SIEM is the one to rely on. The incident-notification terms from Vercel to you are a contract question I can't answer from the docs.

## Show
The access card: Vercel login wall now, Passport and Enterprise Viewer as the next step.

## Don't say
Don't quote a Vercel breach-notification time. None is in our sources.

## Sources
- demo-script.md, "Three tiers" table (audit logs row) and "APRA mapping" (CPS 234)
- governance-research.md §1 (CPS 234 row), §2 (Audit logs, SIEM), §7 gap 6
- objections-research.md R-23, R-24, R-27
