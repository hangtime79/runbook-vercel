---
id: ask-button
title: The Ask button
act: Act 1
beat: Beat 1.2
route: /story
fast: keep
---

## What
The `Ask: "…"` button at the end of a chapter. It sends that chapter's question to the Ask the data panel.

## Tell
Beat 1.2, Ask the data. The question is already written, so nobody faces a blank box.


## On Vercel
The AI SDK runs the tool loop, and the model is one string on one AI Gateway integration, authenticated by OIDC with no stored key. Time the function spends waiting on the model is not billed as CPU. For the bank: no secret to rotate, and the model can change without touching the app. *Sources: vercel-positioning.md §3 (AI Gateway, OIDC, Functions).*

## Say
The model is one string on one AI Gateway integration: no key stored in this project, and any approved model behind it. While the function waits on the model, it isn't billed CPU for the wait.

## Show
Click a chapter's `Ask: "…"` button.

## Craft
Let the product ask its own first question. It removes the blank-page problem and keeps the demo moving.
