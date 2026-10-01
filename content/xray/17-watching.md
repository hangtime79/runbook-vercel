---
id: watching
title: Who's watching
act: Act 2
beat: Beat 2.4
route: /governance
fast: keep
---

## What
The per-answer readout under an Ask answer: model, time, tokens and cost. It appears once a question has been answered.

## Tell
Point at the readout in the app (model, time, cost), then go to the gateway logs.

## Say
That's your AI inventory for this app, generated, not maintained by hand. Budgets per project; logs and traces can drain to your own SIEM tools.

## CIO
An AI inventory that is generated, not maintained by hand. On Enterprise: audit logs of who changed protection, env vars and roles, drained to Splunk / Datadog / S3.

## Leave the app
Open AI Gateway, then Logs: every call with model, provider, tokens, latency and cost, per project.

## Craft
Show the same fact twice: once inside the app, once in the platform's own record of it.

## Watch out
The readout only exists after a question has been answered. Ask one about two minutes before, and warm every route.
