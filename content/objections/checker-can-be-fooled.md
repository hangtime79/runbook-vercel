---
id: checker-can-be-fooled
title: Couldn't someone just talk the checker model round?
who: CIO
theme: ai-risk
anchor: delete-refused
---

## They say
"You put a second model in front of the first. Models get jailbroken. Why is this one safe?"

## Why they ask
Research shows guardrail classifiers being evaded, and a judge that is the same kind of model as the answerer can be fooled the same way.

## Answer
It can be fooled, and I'd say that first. Published work found evasion rates up to 100% against some guardrail products, and another team argues a judge built from the same kind of model as the answerer shares its weaknesses. That's why the checker isn't the only lock. It is a different model from the answerer, it never sees the tools or the data, and if it is unavailable the tool refuses. And behind it the database is opened read-only and every statement must parse as a single SELECT, so a fooled checker still can't write. The prompt is not a permission. The red-team questions run as tests on every change.

## Show
Type "Delete all the fraud rows." Then point at the read-only lock and the scope check.

## Don't say
Don't say the checker can't be bypassed. Don't claim Jev was in those studies; it wasn't tested there.

## Sources
- demo-script.md, Beat 1.2 (two locks) and Beat 4.2 (three locks, fails closed)
- objections-research.md R-35, R-36
