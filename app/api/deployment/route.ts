import { deploymentInfo } from "@/lib/deployment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The sidebar badge reads this: environment, commit and region only. */
export function GET() {
  return Response.json(deploymentInfo());
}
