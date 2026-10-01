---
id: debugging-black-box
title: When it breaks, can we see why, or is it a black box?
who: Either
theme: competitor
anchor: watching
---

## They say
"I have read that you can't see inside Vercel when something fails. Our SREs need traces and logs."

## Why they ask
Abstracted infrastructure hides the machine, and people who run their own servers distrust that.

## Answer
There are real tools, and one real weak spot. Vercel has runtime logs, request traces (`vercel curl --trace`), `vercel bisect` to find the deployment that broke something, and instant rollback. Vercel Agent can run investigations, in public beta on Pro and Enterprise. Drains send logs and traces to your own tool. The weak spot is retention: runtime logs are kept 1 hour on Hobby, 1 day on Pro, 3 days on Enterprise, and 30 days on Pro or Enterprise with Observability Plus, so a bank should drain to its own SIEM. AI Gateway logs every call with its routing attempts for 30 days. Whether it feels like a black box is opinion; I did not verify the analyst-review complaints about debugging.

## Show
The AI Gateway log row for an answer: model, provider, tokens, latency, cost.

## Don't say
Don't quote Gartner Peer Insights. Don't say logs are kept long by default.

## Sources
- objections-research.md R-49
- vercel-positioning.md §3 (Observability, Instant rollback)
- verification-2026-10.md V-29, V-90
