import { Figure, FigureLabel } from "@/components/Figure";
import { Page, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { FINDINGS, RECOMMENDATIONS } from "@/lib/copy";
import { merchantSpread, typologies, varianceRanking } from "@/lib/findings";
import { pct } from "@/lib/format";
import { source } from "@/lib/source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FindingsPage() {
  const [variance, typos, spread, story] = await Promise.all([
    varianceRanking(),
    typologies(),
    merchantSpread(),
    source.storyFigures(),
  ]);
  const maxRange = Math.max(...variance.map((v) => v.range));
  const { micro, velocity, both } = story.triggers;

  const triggers = [
    { name: "merchant_fraud_rate", value: `${spread}× spread`, caption: FINDINGS.triggerCaptions.merchant, accent: false },
    {
      name: "is_micro_transaction",
      value: `${(micro.rate_flagged / micro.rate_unflagged).toFixed(2)}×`,
      caption: `${pct(micro.rate_flagged, 2)} vs ${pct(micro.rate_unflagged, 2)} unflagged`,
      accent: false,
    },
    {
      name: "velocity_above_1_per_hour",
      value: `${(velocity.rate_flagged / velocity.rate_unflagged).toFixed(2)}×`,
      caption: `${pct(velocity.rate_flagged, 2)} vs ${pct(velocity.rate_unflagged, 2)} unflagged`,
      accent: false,
    },
    {
      name: "micro × velocity",
      value: pct(both.fraud_rate, 2),
      caption: `${both.n.toLocaleString("en-US")} rows — ${FINDINGS.triggerCaptions.both}`,
      accent: true,
    },
  ];

  return (
    <Page>
      <PageHeader kicker={FINDINGS.kicker} title={FINDINGS.title} lede={FINDINGS.lede} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-7">
        <Figure className="gap-2 self-start px-5 py-[18px]">
          <FigureLabel>
            <span>{FINDINGS.varianceTitle}</span>
            <span>{FINDINGS.varianceUnit}</span>
          </FigureLabel>
          {variance.map((v) => (
            <div
              key={v.rank}
              className="grid grid-cols-[20px_minmax(0,170px)_1fr_44px] items-center gap-2.5 text-[13px]"
            >
              <span className="font-mono text-[11px] text-foreground/55">{v.rank}</span>
              <span className="truncate font-mono text-[12px]" title={v.note}>{v.dimension}</span>
              <div className="h-3 bg-foreground/5">
                <div className="h-full bg-signal-600" style={{ width: `${(v.range / maxRange) * 100}%`, opacity: v.rank <= 5 ? 1 : 0.5 }} />
              </div>
              <span className="tnum text-right">{v.range}</span>
            </div>
          ))}
          <p className="mt-1 text-[12px] text-foreground/65">{FINDINGS.varianceCaption}</p>
        </Figure>

        <div className="@container flex flex-col gap-2.5">
          <span className="text-[11px] uppercase tracking-[0.1em] text-foreground/60">{FINDINGS.typologyTitle}</span>
          {typos.map((t) => (
            <div
              key={t.name}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1 border-b border-border py-2.5 text-[13px] @md:grid-cols-[150px_76px_1fr]"
            >
              <span className="text-[17px] font-semibold">{t.name}</span>
              <span
                className={`text-[11px] uppercase tracking-[0.08em] ${
                  t.present === "Yes" ? "font-bold text-[#8f8f8f]" : "text-foreground/60"
                }`}
              >
                {t.present}
              </span>
              <span className="col-span-2 text-foreground/75 text-pretty @md:col-span-1">{t.evidence}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-2.5" aria-labelledby="recs">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="recs" className="text-[30px] font-semibold">{FINDINGS.recsTitle}</h2>
          <span className="text-[12px] text-foreground/60">{FINDINGS.recsSource}</span>
        </div>
        <ol className="m-0 list-none p-0">
          {RECOMMENDATIONS.map((r, i) => (
            <li
              key={r.action}
              className="grid grid-cols-[40px_1fr] items-baseline gap-x-[18px] gap-y-1 border-t border-border py-3.5 md:grid-cols-[40px_minmax(0,1fr)_minmax(0,260px)_150px]"
            >
              <span className="row-span-3 text-[28px] font-semibold leading-none text-signal-700 md:row-span-1">{i + 1}</span>
              <span className="text-[15px] font-medium text-pretty">{r.action}</span>
              <span className="text-[13px] text-foreground/70 text-pretty">{r.evidence}</span>
              <span>
                <Badge variant="outline" className="h-auto rounded-full border-border-strong px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {r.owner}
                </Badge>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Figure className="gap-2.5 px-5 py-[18px]">
        <span className="text-[11px] uppercase tracking-[0.1em] text-foreground/60">{FINDINGS.triggersTitle}</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-[18px]">
          {triggers.map((t) => (
            <div key={t.name} className="flex flex-col gap-0.5">
              <span className="font-mono text-[12px]">{t.name}</span>
              <span className={`text-[26px] font-semibold ${t.accent ? "text-signal-800" : ""}`}>{t.value}</span>
              <span className="text-[12px] text-foreground/65">{t.caption}</span>
            </div>
          ))}
        </div>
      </Figure>
    </Page>
  );
}
