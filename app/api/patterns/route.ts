import { source } from "@/lib/source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The exact chart inputs behind /patterns, for the parity check.
export async function GET() {
  const [hour, subsector, histogram, grid, bands] = await Promise.all([
    source.fraudRateByHour(),
    source.fraudRateBySubsector(),
    source.amountHistogram(),
    source.heatmap(),
    source.amountBands(),
  ]);
  return Response.json({ hour, subsector, histogram, heatmap: grid, amountBands: bands });
}
