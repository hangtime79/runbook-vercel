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
import { systemPrompt } from "@/lib/askPrompt";

export const maxDuration = 120;

const DEFAULT_MODEL = "deepseek/deepseek-v4-pro-0813";
const MAX_MESSAGES = 20;
const MAX_QUESTION_CHARS = 1000;
const MAX_STEPS = 6;

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
  const result = streamText({
    model: pickModel(body.model),
    // Eval only: lets pipeline/eval_ask.mjs prove the SQL guard holds without the prompt's help.
    system: await systemPrompt(evalMode && body.omitWriteRule === true),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(MAX_STEPS),
    tools: {
      query: tool({
        description:
          "Run one read-only DuckDB SELECT (or WITH ... SELECT) against golden_record or features. " +
          "Returns { sql, columns, rows, rowCount, truncated } or { sql, error }.",
        inputSchema: z.object({
          sql: z.string().describe("A single DuckDB SELECT statement."),
        }),
        execute: async ({ sql }) => runReadOnlyQuery(sql),
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      // The model's reasoning is not shown in the UI, so it never leaves the server.
      sendReasoning: false,
      // Token usage is sent only in local eval mode (pipeline/eval_ask.mjs prices it).
      messageMetadata: evalMode
        ? ({ part }) => (part.type === "finish" ? { usage: part.totalUsage } : undefined)
        : undefined,
    }),
  });
}
