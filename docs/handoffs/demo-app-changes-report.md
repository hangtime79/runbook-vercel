# Demo app changes: report

**Status:** Steps 1–7 built, committed, verified locally. **Not done:** the preview deploy (Verification 6). The permission classifier denied `vercel deploy --yes`; it was not retried. So the `syd1` region is set but **not confirmed from a deployment**, and ZDR is **not live-verified**. Nothing pushed.

## Commits (8, `d740630..4ceb8fe`)
`d740630` syd1 + `zdr_check.mjs` · `6e7c92f` ZDR, footer, model switch · `3a05924` badge · `89d3540` /governance · `63ccc73` `lib/source.ts` seam · `3ef4bcd` guard test · `e17ca5a` CI workflow · `4ceb8fe` docs + smoke.

## ZDR result per model
Code sets `zeroDataRetention` and `disallowPromptTraining` on every call, fail closed. The available key belongs to a **Hobby** team: the gateway answers 403 ("ZDR is only available for Pro and Enterprise"), so no live per-model check was possible. The gateway catalogue lists `zdr: "some"` for all three models, so all are **kept**, unverified. Off-ZDR runs used `ASK_ZDR=0` (new; local only).

## Other results
- **Badge env vars:** `VERCEL`, `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_MESSAGE`, `VERCEL_GIT_PROVIDER`, `VERCEL_GIT_REPO_OWNER`, `VERCEL_GIT_REPO_SLUG`, `VERCEL_REGION`.
- **Cost source:** the gateway's per-request `providerMetadata.gateway.cost`; list-price fallback from `data/model_prices.json`.
- **CI jobs:** Build; Copy figures trace to data; Numbers match source data; Read-only guard rejects writes; Ask tool loop (mock model). Actions pinned by SHA. The workflow itself has not run on GitHub.

## Local verification (production build)
Build OK; parity all PASS; `check_story_figures` PASS; `test_guard` 6/6; `test_ask_headline` 3/3; `stress_ask` 6/6 (write refused); `browser_smoke` PASS (footer, badge, `/governance`); `check_model_switch` 4/4 (each model answered as asked, off-list fell back to default). Costs $0.0008–$0.07 per answer, gateway-reported.

**Preview URL:** none.

## Owner to-do
1. Run `vercel deploy --yes` (or approve it); confirm `syd1` and every route incl. `/governance`.
2. Confirm the team is Pro/Enterprise: ZDR fails on Hobby, so `/api/ask` will return errors on a Hobby deployment. Then run `node --env-file=.env.local pipeline/zdr_check.mjs`.
3. `vercel git connect`; GitHub branch protection on `main` (five checks + 1 review); Vercel Deployment Checks for production.
4. Set `ASK_DEMO_MODEL_SWITCH=1` on Vercel.
5. AI Gateway provider allowlist, model rules, project budget.
6. Production deploy.
7. Verify the APRA quotes on `/governance` against the PDFs.

<!-- END OF REPORT -->
