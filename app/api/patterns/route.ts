import {
  amountBands,
  amountHistogram,
  fraudRateByHour,
  fraudRateBySubsector,
  heatmap,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The exact chart inputs behind /patterns, for the parity check.
export async function GET() {
  const [hour, subsector, histogram, grid, bands] = await Promise.all([
    fraudRateByHour(),
    fraudRateBySubsector(),
    amountHistogram(),
    heatmap(),
    amountBands(),
  ]);
  return Response.json({ hour, subsector, histogram, heatmap: grid, amountBands: bands });
}
