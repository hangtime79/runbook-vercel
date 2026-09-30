import { AGE_LABELS, CHAPTERS, type ChapterSrc } from "./copy";
import { readModelSummary } from "./docs";
import { int, pct } from "./format";
import { amountBands, headlineCounts, storyFigures } from "./queries";

export type Bar = { label: string; value: number; highlight: boolean; mono?: boolean };

export type Chapter = {
  idx: number;
  num: string;
  short: string;
  owner: string;
  title: string;
  why: string;
  action: string;
  q: string;
  chartTitle: string;
  note: string;
  stat: string;
  statLabel: string;
  axisMax: number;
  bars: Bar[];
};

export type Kpi = { label: string; value: string; caption: string; accent?: boolean };

// Axis max per chart, from the handoff README. The baseline marker sits at baseline / axisMax.
const AXIS_MAX: Record<ChapterSrc, number> = {
  merchants: 0.85,
  amount: 0.5,
  velocity: 0.9,
  subsector: 0.15,
  signature: 0.12,
  age: 0.12,
  travel: 0.12,
};

export async function loadStory() {
  const [counts, f, bands, model] = await Promise.all([
    headlineCounts(),
    storyFigures(),
    amountBands(),
    readModelSummary(),
  ]);
  const baseline = counts.fraud / counts.labeled;
  const pending = counts.rows - counts.labeled;

  const unsigned = f.signature.find((s) => s.key === 0)!;
  const signed = f.signature.find((s) => s.key === 1)!;
  const signatureEffect = unsigned.fraud_rate / signed.fraud_rate;

  const kpis: Kpi[] = [
    { label: "Fraud rate", value: pct(baseline, 2), caption: "of labeled transactions", accent: true },
    { label: "Confirmed fraud", value: int(counts.fraud), caption: `of ${int(counts.labeled)} labeled · ${int(pending)} pending` },
    {
      label: "Holdout AUC",
      value: model.holdout.auc.toFixed(3),
      caption: `XGBoost · 5-fold ${model.cv.auc_mean.toFixed(3)} ± ${model.cv.auc_std.toFixed(3)}`,
    },
    { label: "Signature effect", value: `${signatureEffect.toFixed(1)}×`, caption: "protection when signed" },
  ];

  const topMerchant = f.merchants[0];
  const micro = bands[0];
  const nextBand = bands[1];
  const v0 = f.velocity.find((v) => v.key === 0)!;
  const v1 = f.velocity.find((v) => v.key === 1)!;
  const subsectorLow = [...f.subsectorBottom].sort((a, b) => b.fraud_rate - a.fraud_rate)[0];
  const ageOldest = f.age[f.age.length - 1];
  const flagged = f.travel.find((t) => t.key === 1)!;
  const notFlagged = f.travel.find((t) => t.key === 0)!;
  const totalSig = unsigned.n + signed.n;

  const built: Record<ChapterSrc, { stat: string; statLabel: string; note?: string; bars: Bar[] }> = {
    merchants: {
      stat: pct(topMerchant.fraud_rate),
      statLabel: `fraud at the worst merchant, across ${int(topMerchant.n)} transactions`,
      bars: f.merchants.map((m, i) => ({
        label: m.merchant_id.replace("M_ID_", ""),
        value: m.fraud_rate,
        highlight: i === 0,
        mono: true,
      })),
    },
    amount: {
      stat: pct(micro.fraud_rate),
      statLabel: `fraud in the ${micro.label} band — ~${Math.round(micro.fraud_rate / nextBand.fraud_rate)}× the ${nextBand.label} band`,
      bars: bands.map((b) => ({ label: b.label, value: b.fraud_rate, highlight: b.label === "$2–$5" || b.label === "$1k+" })),
    },
    velocity: {
      stat: `${(v1.fraud_rate / v0.fraud_rate).toFixed(1)}×`,
      statLabel: `${pct(v0.fraud_rate)} → ${pct(v1.fraud_rate)} with a single prior txn in the last hour`,
      bars: f.velocity.map((v) => ({
        label: `${v.key === 4 ? "4+" : v.key} prior · n=${int(v.n)}`,
        value: v.fraud_rate,
        highlight: v.key === 1,
      })),
    },
    subsector: {
      stat: pct(f.subsectorTop[0].fraud_rate),
      statLabel: `${f.subsectorTop[0].category} vs ${pct(subsectorLow.fraud_rate)} for ${subsectorLow.category}`,
      bars: [
        ...f.subsectorTop.map((s) => ({ label: s.category, value: s.fraud_rate, highlight: true })),
        ...[...f.subsectorBottom]
          .sort((a, b) => b.fraud_rate - a.fraud_rate)
          .map((s) => ({ label: s.category, value: s.fraud_rate, highlight: false })),
      ],
    },
    signature: {
      stat: `${signatureEffect.toFixed(1)}×`,
      statLabel: `unsigned ${pct(unsigned.fraud_rate)} vs signed ${pct(signed.fraud_rate)}`,
      note: `${int(unsigned.n)} unsigned vs ${int(signed.n)} signed transactions.`,
      bars: [
        { label: `Unsigned · ${Math.round((unsigned.n / totalSig) * 100)}%`, value: unsigned.fraud_rate, highlight: true },
        { label: `Signed · ${Math.round((signed.n / totalSig) * 100)}%`, value: signed.fraud_rate, highlight: false },
      ],
    },
    age: {
      stat: pct(ageOldest.fraud_rate),
      statLabel: `fraud for 65+ vs ${pct(baseline)} baseline`,
      bars: f.age.map((a) => ({ label: AGE_LABELS[a.key], value: a.fraud_rate, highlight: a.key === 4 })),
    },
    travel: {
      stat: pct(flagged.fraud_rate),
      statLabel: "fraud when flagged — below baseline",
      bars: [
        { label: "Not flagged", value: notFlagged.fraud_rate, highlight: false },
        { label: `Flagged · ${int(flagged.n)}`, value: flagged.fraud_rate, highlight: true },
      ],
    },
  };

  const chapters: Chapter[] = CHAPTERS.map((c, idx) => ({
    idx,
    num: String(idx + 1).padStart(2, "0"),
    short: c.short,
    owner: c.owner,
    title: c.title,
    why: c.why,
    action: c.action,
    q: c.q,
    chartTitle: c.chartTitle,
    note: built[c.src].note ?? c.note,
    stat: built[c.src].stat,
    statLabel: built[c.src].statLabel,
    axisMax: AXIS_MAX[c.src],
    bars: built[c.src].bars,
  }));

  return { baseline, kpis, chapters };
}
