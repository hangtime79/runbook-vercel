---
id: checks-can-be-bypassed
title: Can't someone just skip the checks and ship?
who: CIO
theme: shadow-it
anchor: change-checks
---

## They say
"Required checks are fine until a deadline hits. Who stops a quick push?"

## Why they ask
APRA says AI-assisted development is straining change and release controls. A control with an easy override isn't one.

## Answer
There are overrides, and you should know them. Vercel's Deployment Checks hold the production build until your checks pass, but Force Promote exists as a bypass; who may use it is a question to confirm with Vercel before you rely on it. Human approval is not a Vercel feature either: it is GitHub branch protection, which you set. So the control is the pair, branch protection on `main` requiring the checks and one review, plus Deployment Checks on production. Both are owner steps on your side. Audit logs on Enterprise record protection changes.

## Show
The PR's check list: build, numbers match source, figures trace to data, read-only guard.

## Don't say
Don't say Vercel enforces human approval. Don't say nothing can bypass the checks.

## Sources
- demo-script.md, Act 3 (Beat 3.3), "Say it before they do: the gaps" row 4, and "Do not claim"
- governance-research.md §2 (Deployment Checks, Audit logs) and §7 gap 7
- objections-research.md R-25
