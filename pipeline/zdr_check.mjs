// Live check: does each model serve a request with per-request zero data retention on?
// Usage: node --env-file=.env.local pipeline/zdr_check.mjs [model,model,...]
// A model with no ZDR-capable provider fails with HTTP 400 "no_providers_available".
// Also prints the gateway metadata keys of a successful call, to see where cost is reported.
import { generateText } from "ai";

const MODELS = (process.argv[2] ?? "openai/gpt-6-luna,deepseek/deepseek-v4-pro-0813,google/gemini-3.8-flash").split(",");

for (const model of MODELS) {
  const t0 = performance.now();
  try {
    const r = await generateText({
      model,
      prompt: "Reply with the single word: ok",
      providerOptions: { gateway: { zeroDataRetention: true, disallowPromptTraining: true } },
    });
    const gw = r.providerMetadata?.gateway ?? {};
    console.log(`${model}: OK in ${Math.round(performance.now() - t0)} ms; gateway metadata keys: ${Object.keys(gw).join(", ")}`);
    console.log(`  cost=${JSON.stringify(gw.cost)} marketCost=${JSON.stringify(gw.marketCost)} routing.planningReasoning=${gw.routing?.planningReasoning ?? "-"}`);
  } catch (e) {
    console.log(`${model}: FAILED ${e?.statusCode ?? ""} ${String(e?.message ?? e).slice(0, 200)}`);
  }
}
