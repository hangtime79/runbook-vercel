import { AmountHistogram, CategoryChart, HourChart } from "@/components/Charts";
import {
  amountHistogram,
  fraudRateByHour,
  fraudRateBySubsector,
  heatmap,
} from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Reds scale: interpolate from near-white to dark red.
function reds(t: number): string {
  const a = [255, 245, 240];
  const b = [103, 0, 13];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

export default async function PatternsPage() {
  const [byHour, byCategory, hist, grid] = await Promise.all([
    fraudRateByHour(),
    fraudRateBySubsector(),
    amountHistogram(),
    heatmap(),
  ]);
  const values = grid.flat().filter((v): v is number => v !== null);
  const lo = Math.min(...values);
  const hi = Math.max(...values);

  return (
    <>
      <h1>Fraud Patterns</h1>
      <h2>Fraud rate by hour</h2>
      <HourChart data={byHour} />
      <h2>Fraud rate by merchant category (top 25)</h2>
      <CategoryChart data={byCategory} />
      <h2>Amount distribution by outcome</h2>
      <AmountHistogram data={hist.bins} />
      <h2>Fraud rate heatmap: hour by day of week</h2>
      <div className="heat">
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="hh">{h}</div>
        ))}
        {grid.map((row, d) => (
          <div key={d} style={{ display: "contents" }}>
            <div className="label">{DAYS[d]}</div>
            {row.map((v, h) => (
              <div
                key={h}
                className="cell"
                title={`${DAYS[d]} ${h}:00, ${v === null ? "no data" : (v * 100).toFixed(2) + "%"}`}
                style={{
                  background: v === null ? "transparent" : reds(hi > lo ? (v - lo) / (hi - lo) : 0),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="legend">
        <span>{(lo * 100).toFixed(1)}%</span>
        <span className="bar" />
        <span>{(hi * 100).toFixed(1)}%</span>
      </div>
    </>
  );
}
