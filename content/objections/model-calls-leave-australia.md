---
id: model-calls-leave-australia
title: Our data can't leave Australia, and your AI calls do
who: CIO
theme: sovereignty
anchor: ai-called
---

## They say
"Your functions run in Sydney, fine. But the questions go to a model. Where does that run?"

## Why they ask
Schema, sample rows and query results travel in every prompt. Under CPS 230 a bank has to tell APRA before it enters a material offshoring arrangement. They want to know whether this is one.

## Answer
You're right, and it's on our list of gaps. The functions and the data stay in Sydney. The model call does not: AI Gateway offers regional inference in the US and the EU only, no Australia, and Vercel's docs say region-pinned gateway hosts are coming, with no date. What I can show you today: every request tells the gateway not to train on your prompts, and on Pro each request also turns on zero data retention. For a regulated workload you classify the data first, and the offshoring assessment goes in your CPS 230 file like any other cloud provider's.

## Show
The AI usage card: the approved model, the retention line, the credential line.

## Don't say
Don't say Australian inference. Don't say APRA has accepted this.

## Sources
- demo-script.md, "Say it before they do: the gaps", row 1
- governance-research.md §3 (AI Gateway regional inference) and §7 gap 1
- objections-research.md R-21, R-28
