import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { runReadOnlyQuery } from "@/lib/askdb";
import { headlineTool, offerHeadlineAfterQuery } from "@/lib/askSteps";
import { systemPrompt } from "@/lib/askPrompt";

export const maxDuration = 120;

const DEFAULT_MODEL = "openai/gpt-6-luna";
const MAX_MESSAGES = 20;
const MAX_QUESTION_CHARS = 1000;
// query + headline + answer is three steps; the rest is room for a failed query to be retried.
const MAX_STEPS = 8;

function pickModel(requested: unknown): string {
  // Local eval only. In the deployed app ASK_ALLOW_MODEL_OVERRIDE is unset, so the request body
  // can never choose the model.
  if (process.env.ASK_ALLOW_MODEL_OVERRIDE === "1" && typeof requested === "string" && requested) {
    return requested;
  }
  return process.env.ASK_MODEL || DEFAULT_MODEL;
}

export async function POST(req: Request) {
  let body: { messages?: UIMessage[]; model?: unknown; omitWriteRule?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return Response.json({ error: "Send between 1 and 20 messages." }, { status: 400 });
  }
  const tooLong = messages.some(
    (m) =>
      m.role === "user" &&
      m.parts?.some((p) => p.type === "text" && p.text.length > MAX_QUESTION_CHARS)
  );
  if (tooLong) {
    return Response.json({ error: "Question is too long." }, { status: 400 });
  }

  const evalMode = process.env.ASK_ALLOW_MODEL_OVERRIDE === "1";
  const model = pickModel(body.model);
  const result = streamText({
    model,
    // Stop the model call when the browser disconnects instead of streaming to nobody.
    abortSignal: req.signal,
    // Streams that end early left no trace before these were added; log the cause server-side.
    onError: ({ error }) => console.error(`[ask] stream error (${model}):`, error),
    onAbort: () => console.warn(`[ask] aborted by client (${model})`),
    // Eval only: lets pipeline/eval_ask.mjs prove the SQL guard holds without the prompt's help.
    system: await systemPrompt(evalMode && body.omitWriteRule === true),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(MAX_STEPS),
    // See lib/askSteps.ts for why the headline is offered rather than forced.
    prepareStep: offerHeadlineAfterQuery,
    tools: {
      query: tool({
        description:
          "Run one read-only DuckDB SELECT (or WITH ... SELECT) against golden_record or features. " +
          "Returns { sql, columns, rows, rowCount, truncated } or { sql, error }.",
        inputSchema: z.object({
          sql: z.string().describe("A single DuckDB SELECT statement."),
        }),
        // The elapsed time is shown in the evidence card; the guard itself is untouched.
        execute: async ({ sql }) => {
          const t0 = performance.now();
          const result = await runReadOnlyQuery(sql);
          return { ...result, ms: Math.round(performance.now() - t0) };
        },
      }),
      headline: headlineTool,
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // The model's reasoning is not shown in the UI, so it never leaves the server.
      sendReasoning: false,
      // The client gets a plain message; the detail stays in the server log.
      onError: (error) => {
        console.error(`[ask] UI stream error (${model}):`, error);
        return "The answer stream failed partway. Try again.";
      },
      // Token usage is sent only in local eval mode (pipeline/eval_ask.mjs prices it).
      messageMetadata: evalMode
        ? ({ part }) => (part.type === "finish" ? { usage: part.totalUsage } : undefined)
        : undefined,
    }),
  });
}
