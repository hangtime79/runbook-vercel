---
id: provider-keeps-prompts
title: Does anyone keep or train on our prompts?
who: CIO
theme: ai-risk
anchor: ai-called
---

## They say
"The prompts have schema and sample rows in them. Who keeps them, and does anyone train on them?"

## Why they ask
Fraud data is sensitive, and APRA says embedded AI makes upstream dependencies, such as model providers, opaque.

## Answer
Two layers. Vercel's gateway doesn't train on your prompts and doesn't keep prompt or response content: it's deleted when the request completes. It does log metadata, such as model, provider, tokens, cost and every routing attempt, for 30 days. The model provider is a separate party, and Vercel's own policy doesn't bind it. So the controls that cover the whole path are per-request zero data retention (Pro), prompt-training disallowance, and the provider and model allowlists. Every request in this app sets no-training. On the Hobby plan we run today, zero data retention is off; it's one setting on Pro.

## Show
The AI usage card: retention line, allowlist, and no stored key.

## Don't say
Don't say zero data retention is on in this demo. It isn't, on Hobby.

## Sources
- demo-script.md, Beat 2.3
- vercel-positioning.md §6 ("Does Vercel see or keep my prompts?")
- governance-research.md §4 (ZDR, No training, Request logs)
- objections-research.md R-32
