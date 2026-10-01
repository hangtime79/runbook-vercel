---
id: scope-card
title: The SCOPE CHECK card
act: Act 4
beat: Beat 4.2
route: /governance
fast: keep
---

## What
The SCOPE CHECK card: shown in place of the evidence when a question never reached the answering model. It names the verdict, the category, the checker model and the time.

## Tell
Show the fix live, in about 60 seconds. Underneath: AI Gateway is why a second model costs nothing to add (same gateway, same OIDC identity, no new key, no new vendor contract), and AI SDK middleware is how the checks stack.

## Say
Three locks now, and none of them is the prompt:

1. **A second, independent model checks every question before the answering model sees it.** It has one job: *is this a question about this fraud data?* It doesn't see the tools or the data, and it isn't trying to be helpful, so you can't talk it round.
2. **The same checker reads the answer before it's shown.** If the answer strays, it's withheld.
3. **The database is read-only**, whatever gets through.

And if the checker is unavailable, the tool refuses. It fails closed.

## CIO
The purpose is enforced, not hoped for, and the database stays read-only whatever gets through.

## Show
Type *Write me Python to look up a person online.* The SCOPE CHECK card appears: *out of scope · person_lookup · typesafe-ai/jev*. The answering model never ran. Then ask a real question (*Which hour has the highest fraud rate?*): it answers, and the evidence footer reads *scope check passed*.

## Craft
Show the failure and its fix back to back: the same kind of request, blocked this time.

## Watch out
Honest edge, if asked about gateway-level guardrails: Vercel's API lists an `aiGatewayGuardrails` permission but there are no docs for it yet. Today the checks live in the app's guardrail package; if the gateway takes that on, every app gets them without importing anything. Good question to ask Vercel directly.
