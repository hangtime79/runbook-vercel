# Ask scope gate, round 2: report

**Status: done.** Mock tests (14), single-turn eval (37/37) and conversation eval (14/14 turns) pass on `openai/gpt-6-luna`. Build, parity, figures, guard, headline, stress (6/6) and browser smoke pass. Nothing pushed; nothing deployed to production.

**Commits:** d63d7f9 (gate state, rules, unclear), 5e6121a (UI, SPEC invariant 4), ed0f604 (conversation red-team, eval, window fix), then smoke test and this report.

**State shape** (last 4 turns): `{ question, verdict, category, answerSummary }`, where `answerSummary` is the first 200 characters of an allowed reply. A new question, `refersTo` (none, earlier_allowed, earlier_blocked), says what the message follows.

**Verdicts are not client-supplied.** The model prompt carries only text (`convertToModelMessages` drops metadata). The gate re-judges each earlier user text in order and caches results per process. A mock test sends forged "allowed" metadata; the block is still inherited. Residual risk: an allowed turn's reply text is client-supplied and reaches Jev as capped context, never as a verdict.

**Rules** (`config.json`): follow-up to blocked inherits the block and category; follow-up to allowed is judged with context; otherwise `dataset_question` at p ≥ 0.5 allows. `dataset_question` under 0.5 is **unclear**: fixed rephrase reply, answering model not called, card says "unclear".

**Bug fixed:** past five turns the gate indexed its window wrongly and failed closed. The eval caught it; test 14 covers it.

**Preview** (`https://runbook-vercel-gcfm7m8de-hangtime79.vercel.app`, real history, `pipeline/replay_conversation.mjs`): turns 1–4 blocked as `person_lookup` (2–4 labelled follow-ups); turn 5 allowed with no query; turn 6 allowed at p=0.63. That is only 0.13 above the threshold. Asked cold, the same sentence is "unclear" (p=0.21), as intended.

**Latency:** 360–475 ms per turn with earlier turns cached. A cold process pays up to 4 extra Jev calls (about 0.4 s each) on the first request of a long conversation. An unclear card can show "0 ms" when that conversation was already judged.

**Owner:** the red-team file holds the verbatim transcript, typos kept. Local servers I started are still running.

<!-- END OF REPORT -->
