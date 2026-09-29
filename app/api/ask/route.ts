import { generateText } from "ai";

export const maxDuration = 60;

const DEFAULT_MODEL = "deepseek/deepseek-v4-pro-0813";

// Step 1 smoke test: one fixed prompt to ASK_MODEL through AI Gateway. Replaced in Step 3.
export async function GET() {
  const model = process.env.ASK_MODEL || DEFAULT_MODEL;
  const { text } = await generateText({
    model,
    prompt: "Reply with the single word: ready",
  });
  return Response.json({ model, text });
}
