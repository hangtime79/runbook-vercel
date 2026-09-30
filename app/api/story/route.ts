import { storyFigures } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The exact aggregates behind the Story chapters and the Findings triggers, for the parity check.
export async function GET() {
  return Response.json(await storyFigures());
}
