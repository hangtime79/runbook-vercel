# P2 handoff report

## Status
Stopped early, waiting on the owner. Steps 1–5 are done and Step 6 is done except the preview deploy: the auto-mode classifier denied `vercel deploy --yes` as a "Production Deploy" although it had no `--prod`. Last step completed: Step 6, item 2 (build and parity).

## Commits
- 50dfed0 Add AI SDK, React hooks and zod; smoke route for ASK_MODEL via AI Gateway
- 1da6ea0 Add read-only fraud.duckdb and SELECT-only query guard for Ask the data
- 08afe81 Add /api/ask query tool route and Ask the data UI on the Narrative page
- 3bf5e69 Add Ask the data oracle, eval script and three-model comparison
- 14e8a62 Document Ask the data: read-only guard, ASK_MODEL, gateway auth, local run
- fa0e854 Default ASK_MODEL to openai/gpt-6-luna and record the decision

## What was built
- Added: `lib/askdb.ts`, `lib/askPrompt.ts`, `app/api/ask/route.ts`, `components/AskData.tsx`, `data/fraud.duckdb`, `pipeline/ask_oracle.py`, `pipeline/ask_expected.json`, `pipeline/eval_ask.mjs`, `docs/ask-eval.md`.
- Changed: `app/page.tsx`, `pipeline/export_web_data.py`, `next.config.ts`, `package.json`, `SPEC.md`, `CLAUDE.md`, `README.md`, `.env.example`.
- Packages: `ai` 7.0.122, `@ai-sdk/react` 4.0.125, `zod` 4.6.5.
- Gateway login: locally `AI_GATEWAY_API_KEY` from the shell; on Vercel the deployment's OIDC token, unverified because there is no deploy.
- Read-only protection, two layers: the DuckDB file opens READ_ONLY with external access off and configuration locked; each query must parse as exactly one SELECT through `json_serialize_sql`. Results are capped at 200 rows with a 10 s timeout.

## Eval results
One run per model and question; correct is out of 5.

| Model | Correct | Write attempts refused | Median latency | Total cost (7 cases) |
|---|---|---|---|---|
| google/gemini-3.8-flash | 5 | yes | 10.8s | $0.34 |
| deepseek/deepseek-v4-pro-0813 | 5 | yes | 8.1s | $0.18 |
| openai/gpt-6-luna | 5 | yes | 3.9s | $0.03 |

Recommended default: `openai/gpt-6-luna`, now set. Only gemini's forced write reached the guard; the other two models refused first.

## Deploy
No preview URL. Nothing was deployed, so no demo question or write attempt has been tested on a preview. Locally, on a production build, all questions and the write attempt behaved correctly.

## Deviations from the plan
- Default model is luna at the owner's instruction; the plan said gemini.
- Added eval-only `omitWriteRule` and usage metadata, gated by `ASK_ALLOW_MODEL_OVERRIDE=1`.
- Added a preflight to the eval after a stale dev server invalidated the first run; that run was discarded.

## Needs the owner
- Run `! vercel deploy --yes`, or add a Bash permission rule for it. I will then test `/api/stats`, each demo question and the write attempt with `vercel curl`.
- A local production server may still hold port 3000: `! kill $(lsof -ti tcp:3000)`.

## Open issues
- Streams ended early about 3 times in roughly 35 local requests, with no server error. The UI shows a message; the cause is unknown.
- Gateway OIDC auth on Vercel is unverified.
- `/api/ask` file tracing (`fraud.duckdb`, `libduckdb.so`) is untested on Vercel.
- The eval is a single run per model, so latency and cost gaps are indicative.

<!-- END OF REPORT -->
