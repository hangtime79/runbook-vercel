import { AmountBandChart } from "@/components/charts/AmountBandChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { HourChart } from "@/components/charts/HourChart";
import { Figure, RateBars } from "@/components/Figure";
import { Page, PageHeader } from "@/components/PageHeader";
import { PATTERNS } from "@/lib/copy";
import { int, pct } from "@/lib/format";
import { source } from "@/lib/source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OVERNIGHT = { start: 2, end: 6 };
const CATEGORY_ROWS = 14;
const HIGH_RISK = { from: 1, to: 5 }; // rows 2-6 of the ranking, the "high-risk five"
const SMALL_SAMPLE = 500;

function Lead({ lead, rest }: { lead: string; rest: string }) {
  return (
    <span className="text-[13px] text-signal-800">
      <b>{lead}</b>
      {rest}
    </span>
  );
}

export default async function PatternsPage() {
  const [counts, byHour, byCategory, grid, bands] = await Promise.all([
    source.headlineCounts(),
    source.fraudRateByHour(),
    source.fraudRateBySubsector(),
    source.heatmap(),
    source.amountBands(),
  ]);
  const baseline = counts.fraud / counts.labeled;
  const categories = byCategory.slice(0, CATEGORY_ROWS);
  const catMax = categories[0].fraud_rate;

  const bandTotal = bands.reduce((s, b) => s + b.n, 0);
  const top = bands[bands.length - 1];
  const underTopShare = (bandTotal - top.n) / bandTotal;

  return (
    <Page>
      <PageHeader kicker={PATTERNS.kicker} title={PATTERNS.title} lede={PATTERNS.lede} />

      <Figure className="gap-3 px-[22px] pb-4 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h3 className="text-[24px] font-semibold">{PATTERNS.hour.title}</h3>
          <Lead {...PATTERNS.hour} />
        </div>
        <HourChart data={byHour} baseline={baseline} windowStart={OVERNIGHT.start} windowEnd={OVERNIGHT.end} />
      </Figure>

      <Figure className="gap-3 px-[22px] pb-4 pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h3 className="text-[24px] font-semibold">{PATTERNS.heat.title}</h3>
          <Lead {...PATTERNS.heat} />
        </div>
        <Heatmap grid={grid} />
      </Figure>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-7">
        <Figure className="gap-2.5 px-[22px] pb-4 pt-5">
          <h3 className="text-[24px] font-semibold">{PATTERNS.category.title}</h3>
          <Lead lead={PATTERNS.category.lead} rest={PATTERNS.category.rest} />
          <RateBars
            rows={categories.map((c, i) => ({
              label: c.n < SMALL_SAMPLE ? `${c.category} · n=${int(c.n)}` : c.category,
              value: c.fraud_rate,
              highlight: i >= HIGH_RISK.from && i <= HIGH_RISK.to,
            }))}
            axisMax={catMax}
            baseline={baseline}
            rowClass="text-[12px]"
            labelWidth={184}
            barHeight={11}
          />
          <p className="text-[12px] text-foreground/65">{PATTERNS.category.caption}</p>
        </Figure>

        <Figure className="gap-2.5 px-[22px] pb-4 pt-5">
          <h3 className="text-[24px] font-semibold">{PATTERNS.amount.title}</h3>
          <Lead lead={PATTERNS.amount.lead} rest={PATTERNS.amount.rest} />
          <AmountBandChart
            baseline={baseline}
            bands={bands.map((b) => ({
              ...b,
              highlight: b.label === "$2–$5" || b.label === "$1k+",
              strong: b.label === "$2–$5",
            }))}
          />
          <p className="text-[12px] text-foreground/65">
            {pct(underTopShare, 0)} of transactions in these bands sit under $1k; the {top.label} arm holds {int(top.n)}.
          </p>
        </Figure>
      </div>
    </Page>
  );
}
