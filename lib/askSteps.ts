import { tool } from "ai";
import { z } from "zod";

// Kept free of "@/" imports so pipeline/test_ask_headline.mts can run it with plain node.

/**
 * Structured headline figure for the answer card, so the UI never parses prose for a number.
 * It only echoes its input and touches no data.
 */
export const headlineTool = tool({
  description:
    "Show the one key figure of your answer as a large stat above it. You are asked for it right " +
    "after a query succeeds, before you write the answer. value is a short figure taken from the " +
    "query results (for example '14.0%', '2.3×', '24,080'); label says what it measures in under " +
    "12 words.",
  inputSchema: z.object({
    value: z.string().max(24).describe("The figure, formatted for display."),
    label: z.string().max(120).describe("What the figure measures."),
  }),
  execute: async ({ value, label }) => ({ value, label }),
});

type StepLike = { toolResults: { toolName: string; output?: unknown }[] };

/**
 * `prepareStep` for the Ask route. After a query that succeeded, offer only the `headline` tool
 * for the next step. A failed or refused query gets none: there is no figure to show.
 *
 * Why `activeTools` and not `toolChoice: { type: "tool", toolName: "headline" }`: the model does
 * not call the tool unprompted, so it has to be pushed, but a forced choice throws
 * ToolChoiceViolationError when the model returns nothing usable (finishReason "other"), and the
 * SDK never retries that error (`!isToolChoiceViolation` in streamText's retry path), so the
 * whole answer failed. With the tool merely the only one on offer, a step that skips it just
 * writes the answer text: the answer completes and the UI shows no stat card.
 */
export function offerHeadlineAfterQuery({ steps }: { steps: StepLike[] }) {
  const succeeded = steps.at(-1)?.toolResults.some(
    (r) => r.toolName === "query" && !(r.output && typeof r.output === "object" && "error" in r.output)
  );
  return succeeded ? { activeTools: ["headline" as const] } : {};
}
