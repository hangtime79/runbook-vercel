---
id: ai-called
title: What AI it calls
act: Act 2
beat: Beat 2.3
route: /governance
fast: keep
---

## What
The AI usage card on `/governance`: the allowed models, the model answering now, data retention, the credential, what the AI can do, and the scope check.

## Tell
Stay on `/governance`, then go to the AI Gateway settings.

## Say
The model is one approved string. Your team sets a **provider allowlist**: a developer cannot route traffic to a provider the org hasn't approved. **Routing rules** deny specific models for every app on the team's credentials.

Every request tells the gateway **no training** on your prompts. On Pro, each request also turns on **zero data retention**, so the model providers don't keep them either. The code is already written that way; it's one setting.

There is **no API key** in this project. The deployment authenticates to the gateway with its own short-lived identity (OIDC). Nothing to leak, nothing to rotate.

## CIO
AI risk: only approved providers, no training on prompts, and no stored key to leak or rotate.

## Leave the app
Open the AI Gateway settings and show the provider allowlist and the model deny rule.

## Watch out
Check on the day which gateway controls (provider allowlist, routing rules, budgets) your plan shows before demoing them live; their plan requirements weren't stated in the docs we read.

Some controls are beta (gateway routing rules, Vercel Agent). Say so when you show them.
