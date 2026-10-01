---
id: model-switch
title: One integration, any model
act: Act 4
beat: Beat 4.4
route: /governance
fast: skip
---

## What
The model select in the Ask panel header, which lists the allowlisted models. When the switch is off, this marker falls back to the per-answer readout.

## Tell
Switch the model in the panel (three are allowlisted) and ask the same question. On the eval set, all three answered 5/5 correctly; median time was 3.9 s on openai/gpt-6-luna, 8.1 s on deepseek/deepseek-v4-pro-0813 and 10.8 s on google/gemini-3.8-flash.

## Say
Three providers, one integration, same answer. That's the substitution APRA asks about: *the credibility and feasibility of substitution, portability or exit arrangements.* We tested it.

The AI proposes; the evidence card shows its work; the investigator decides. It never acts on an account, and it can't write.

## CIO
Substitution and exit: the same integration reaches three providers, and the answer did not change.

## Show
Pick another model in the select and ask the same question again.

## Craft
Prove a claim by doing it live, then say what the result means for the buyer's regulator.

## Watch out
The model select only appears when `ASK_DEMO_MODEL_SWITCH=1` is set on the Vercel project. Until it is set on production, this marker sits on the readout instead.
