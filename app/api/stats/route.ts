import { source } from "@/lib/source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await source.headlineCounts());
}
