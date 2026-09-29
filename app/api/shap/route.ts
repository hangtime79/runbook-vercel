import { readShapImportance } from "@/lib/docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json((await readShapImportance()).slice(0, 15));
}
