import { Figure, FigureLabel } from "@/components/Figure";
import { Page, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { MODEL } from "@/lib/copy";
import { readModelSummary, readShapImportance } from "@/lib/docs";
import { int } from "@/lib/format";

export const runtime = "nodejs";

const SHAP_BARS = 15;
const TOP_HIGHLIGHT = 3;
const TOP_TOOLTIPS = 5;

function Kpi({ label, value, caption, accent = false }: { label: string; value: string; caption: string; accent?: boolean }) {
  return (
    <Figure className="gap-[3px] px-4 py-3.5">
      <span className="text-[10px] uppercase tracking-kicker text-foreground/[0.62]">{label}</span>
      <span className={`text-[34px] font-semibold leading-none tracking-tighter2 ${accent ? "text-signal-800" : ""}`}>{value}</span>
      <span className="text-[12px] text-foreground/[0.62]">{caption}</span>
    </Figure>
  );
}

export default async function ModelPage() {
  const [m, importance] = await Promise.all([readModelSummary(), readShapImportance()]);
  const shap = importance.slice(0, SHAP_BARS);
  const shapMax = shap[0].mean_abs_shap;
  const d = m.diagnostics;
  const cm = m.confusion;

  // shap.md's direction table has one row for "Item Category B/C"; the bars are per flag.
  const direction = (label: string) =>
    m.shap_directions[label] ?? m.shap_directions[label.replace(/ ([BCD]) Flag$/, " B/C")] ?? "";

  const checks = [
    { name: "Leakage", status: d.checks[0].status, detail: `AUC ${m.holdout.auc.toFixed(3)} under the ${d.leakage_ceiling} ceiling` },
    { name: "Underfit", status: d.checks[1].status, detail: `above the ${d.underfit_floor} floor` },
    { name: "Stability", status: d.checks[2].status, detail: `CV std ${m.cv.auc_std.toFixed(4)}, well under ${d.cv_std_limit}` },
    { name: "Overfit", status: d.checks[3].status, detail: `early stop at round ${m.holdout.best_round} of ${m.holdout.max_rounds}` },
  ];

  const cells = [
    { v: cm.tn, l: "true negative" },
    { v: cm.fp, l: "false alarm" },
    { v: cm.fn, l: "missed" },
    { v: cm.tp, l: "caught", hit: true },
  ];

  return (
    <Page>
      <PageHeader
        kicker={`Phase 6–7 · XGBoost · ${m.n_features} features · ${MODEL.kickerTail.replace("PASS", d.overall)}`}
        title={MODEL.title}
        lede={MODEL.lede}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-5">
        <Kpi label="Holdout AUC" value={m.holdout.auc.toFixed(3)} caption={`expected band ${d.underfit_floor}–${d.leakage_ceiling}`} accent />
        <Kpi label="5-fold CV AUC" value={m.cv.auc_mean.toFixed(3)} caption={`± ${m.cv.auc_std.toFixed(4)} — stable`} />
        <Kpi label="PR-AUC" value={m.holdout.pr_auc.toFixed(3)} caption={`vs ${m.holdout.prevalence.toFixed(3)} random`} />
        <Kpi
          label="Operating point"
          value={`${Math.round(m.operating_point.precision * 100)} / ${Math.round(m.operating_point.recall * 100)}`}
          caption={`% precision / recall @ ${m.operating_point.threshold}`}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-7">
        <Figure className="gap-2 px-[22px] pb-4 pt-5">
          <h3 className="text-[24px] font-semibold">{MODEL.shapTitle}</h3>
          <span className="text-[13px] text-signal-800">
            <b>{MODEL.shapLead}</b>
            {MODEL.shapRest}
          </span>
          {shap.map((s, i) => (
            <div key={s.feature} className="grid grid-cols-[minmax(0,210px)_1fr_44px] items-center gap-2.5 text-[12px]">
              <span className="truncate text-right" title={i < TOP_TOOLTIPS ? direction(s.feature) : undefined}>
                {s.feature}
              </span>
              <div className="h-3">
                <div
                  className="h-full bg-signal-600"
                  style={{ width: `${(s.mean_abs_shap / shapMax) * 100}%`, opacity: i < TOP_HIGHLIGHT ? 1 : 0.35 }}
                />
              </div>
              <span className="tnum text-right font-mono text-[11px]">{s.mean_abs_shap.toFixed(3)}</span>
            </div>
          ))}
          <p className="mt-1 text-[12px] text-foreground/65">{MODEL.shapCaption}</p>
          <ul className="sr-only">
            {shap.slice(0, TOP_TOOLTIPS).map((s) => (
              <li key={s.feature}>{s.feature}: {direction(s.feature)}</li>
            ))}
          </ul>
        </Figure>

        <div className="flex flex-col gap-7">
          <Figure className="gap-2.5 px-[22px] pb-4 pt-5">
            <h3 className="text-[24px] font-semibold">
              {MODEL.confusionTitle} @ {m.operating_point.threshold}
            </h3>
            <div className="grid grid-cols-[90px_1fr_1fr] gap-1 text-[12px]">
              <span />
              <span className="text-center text-foreground/60">pred legit</span>
              <span className="text-center text-foreground/60">pred fraud</span>
              <span className="flex items-center text-foreground/60">actual legit</span>
              {cells.slice(0, 2).map((c) => (
                <Cell key={c.l} {...c} />
              ))}
              <span className="flex items-center text-foreground/60">actual fraud</span>
              {cells.slice(2).map((c) => (
                <Cell key={c.l} {...c} />
              ))}
            </div>
          </Figure>

          <div className="flex flex-col">
            <FigureLabel>
              <span className="pb-1.5">{MODEL.diagnosticsTitle}</span>
            </FigureLabel>
            {checks.map((k) => (
              <div key={k.name} className="grid grid-cols-[54px_1fr] gap-2.5 border-t border-border py-[9px] text-[13px]">
                <Badge className="h-auto justify-center rounded-full bg-signal-100 px-2 py-0.5 text-[11px] font-medium text-signal-pill">
                  {k.status}
                </Badge>
                <span>
                  <b className="font-medium">{k.name}</b> — {k.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

function Cell({ v, l, hit = false }: { v: number; l: string; hit?: boolean }) {
  return (
    <div className={`flex flex-col border p-3.5 ${hit ? "border-signal-600 bg-signal-100 text-signal-900" : "border-border"}`}>
      <span className="tnum text-[26px] font-semibold">{int(v)}</span>
      <span>{l}</span>
    </div>
  );
}
