---
id: change-checks
title: The checks
act: Act 3
beat: Beat 3.3
route: /governance
fast: keep
---

## What
The second stop on the Change control card: the checks that run on every pull request. They need no secrets and never call the AI Gateway.

## Tell
Show the pull request's check list, and point back to Act 1: **Read-only guard rejects writes** is the check for the delete refusal you saw earlier.


## On Vercel
Vercel's Deployment Checks hold the production build until the required GitHub checks pass; Force Promote exists as a bypass. Human approval is GitHub branch protection, not a Vercel feature. For the bank: the checks are yours to define, and two owners (GitHub and Vercel) must both be configured. *On the other side of the bridge: the pull request's check list and the project's Deployment Checks settings. Source: governance-research.md §2 and §5.*

## Say
These are yours to define. Vercel's **Deployment Checks** hold the production build until they pass. Branch protection means nothing merges without them and a human approval.

## CIO
The checks are yours to define, and nothing merges without them and a human approval.

## Leave the app
Open the pull request's check list: build, **the numbers still match the source data**, **every figure in the copy traces to the data**, **the read-only lock rejects writes**, and a browser test of the Ask flow. Optional: a **Vercel Agent** code review comment on the pull request (public beta).

## Craft
Pay off the earlier promise: the lock shown in Act 1 now appears as a named check.

## Watch out
The real check list is longer than the five above. It also runs the scope gate and "X-ray stops match the script". Read what is on screen.

Force Promote can bypass checks, and budgets are soft caps. Say: "Force Promote exists as an override; who may use it is a question to confirm with Vercel before you rely on it."

Do not claim that Vercel enforces human approval. GitHub branch protection does.
