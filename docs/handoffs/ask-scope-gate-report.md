# Ask scope gate: report

**Status: done.** Build, parity, copy-figure, guard, headline and scope-gate tests pass. Red-team eval is 96/96 on all three answering models. Stress test is 6/6. Smoke test and demo screens pass. Nothing pushed; nothing deployed to production.

**Commits:** 93f2442 (prompt SCOPE rules), 784345c (middleware stack and mock test), c3e1f24 (route, UI, governance, CI job), 01ff156 (red-team suite, eval, results), b776cd5 (screenshots, CLAUDE.md), plus `measure_guard.mjs` and this report. One screenshot commit was reverted (7eef903): it was taken with ZDR on and showed an error state.

**Evaluate API used** (read from `node_modules/ai/docs/03-ai-sdk-core/32-evaluation.mdx` and confirmed with a live call): `experimental_evaluate({ model: "typesafe-ai/jev", state, questions, providerOptions })` with one `boolean` question (`probability`) and one `choice` question (`choice`, `probabilities`). Result carries `usage` and `providerMetadata.gateway`. State is JSON: tool purpose, table and column list, last two earlier questions, the message.

**Stack:** `wrapLanguageModel` with `[scopeGate, outputCheck]` from `lib/guardrails/config.json`. First entry is outermost; the mock test proves a blocked question never reaches the answering model or the output check, and that a gate or output-check error fails closed. Verdicts reach the UI through a per-request context into message metadata.

**Threshold:** 0.5, and category must be `dataset_question`. Jev's boolean alone is weak: with a vague table description, four legitimate questions (signature, age) scored 0.11–0.26 and were wrongly blocked. Listing the real columns fixed that. The sweep in `docs/ask-scope-eval.md` shows category-required holds 13/13 blocked and 19/19 allowed from 0.3 to 0.6; without the category, 0.5 misses one block.

**Red-team (per model, all three identical):** must-block 13/13, must-allow 19/19, no misses, no errors. The output check withheld nothing, because the gate caught everything first; its withholding path is tested only with mocks. The five production texts are paraphrases; the exact wording was not kept.

**Added latency and cost per allowed question** (three live questions, preview-equivalent server): gate 444–590 ms, output check 346–389 ms, about 0.8–1.0 s on 6.6–8.5 s total. Tokens: gate about 715 in + 87 out, output check about 600 in + 82 out. Arithmetic: (715 + 87) × $0.04 ÷ 1,000,000 = $0.000032 list price per gate call; the gateway reported $0.00003. Output check about $0.000025. Total about $0.00006 per question, against about $0.0009 for the answer.

**Preview:** https://runbook-vercel-2lzxxw3sq-hangtime79.vercel.app. Via `vercel curl`: "Which age groups see the most fraud?" answered (p=0.90); the Q5 "Euclidean circle" prompt was refused (code_request, p=0.06, 671 ms).

**Notes for the owner**
- The delete question is now refused by the gate (write_request, p≈0.50–0.52) before the SQL guard. The guard still holds: `eval_ask.mjs` can bypass the gate with `skipScopeGate` in override mode.
- One Jev call was aborted during retry backoff in a local run and failed closed ("scope check is unavailable"). Expected, but a transient Jev failure is visible to users.
- Screen 13 (DeepSeek) took 107 s on one run; that model is slow on that question, not related to the gate.
- Local servers I started are still running on ports 3000, 3100 and 3101.
- Branch protection should add the new check "Scope gate blocks off-topic questions".

<!-- END OF REPORT -->
