import { ExplorerTable } from "@/components/explorer/ExplorerTable";
import { readModelSummary } from "@/lib/docs";
import { explorerRows, headlineCounts } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Hot merchant": a training-slice merchant fraud rate above 3x the baseline (the playbook's
// merchant_concentration trigger).
const HOT_MULTIPLE = 3;

export default async function ExplorerPage() {
  const [rows, model, counts] = await Promise.all([explorerRows(), readModelSummary(), headlineCounts()]);
  const baseline = counts.fraud / counts.labeled;
  return (
    <div className="flex flex-col px-4 pb-16 pt-10 sm:px-10">
      <ExplorerTable rows={rows} threshold={model.operating_point.threshold} hotMerchantRate={HOT_MULTIPLE * baseline} />
    </div>
  );
}
