import {
  amountHistogram,
  fraudRateByHour,
  fraudRateBySubsector,
  heatmap,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The exact chart inputs behind /patterns, for the parity check.
export async function GET() {
  const [hour, subsector, histogram, grid] = await Promise.all([
    fraudRateByHour(),
    fraudRateBySubsector(),
    amountHistogram(),
    heatmap(),
  ]);
  return Response.json({ hour, subsector, histogram, heatmap: grid });
}
