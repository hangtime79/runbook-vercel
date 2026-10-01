---
id: long-running-work
title: Our analyses run for hours. Can this host them?
who: Either
theme: competitor
anchor: underneath
---

## They say
"Fraud models and backfills run for hours. I thought Vercel only did short web requests, with no WebSockets and no workers."

## Why they ask
Older descriptions of Vercel say exactly that, and a team that has hit a timeout on another host expects the same here.

## Answer
That is out of date, but the limits are real. A function can run up to 800 seconds on Pro and Enterprise, and up to 1,800 seconds in beta on supported runtimes; Hobby is 300. WebSockets are in public beta, but a connection closes when the function reaches its maximum duration. Work started with `waitUntil` has the same timeout as the function. For longer jobs Vercel points to Workflows, which pause and resume across crashes and deployments for minutes to months, built on Queues, which are in public beta. Sandbox runs untrusted or agent-generated code in isolated microVMs. Two things stay elsewhere: request and response bodies are capped at 4.5 MB, and there is no GPU compute, so Vercel's own comparison says teams add GPU providers for training. For always-on workers and GPU training, Northflank-style hosts win, and I would not argue it. This app has no long job: its queries run in seconds.

## Show
The Ask answer's elapsed time, to show the shape of work this app does.

## Don't say
Don't say Vercel has no WebSockets or no background work. Don't promise GPUs. Don't quote 1,800 seconds without saying it is beta.

## Sources
- objections-research.md R-40, R-41, R-42, R-43, R-44, R-45
- verification-2026-10.md V-31
