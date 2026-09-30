import { pct } from "@/lib/format";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// 9-step ramp from the handoff README, indexed by round(sqrt(t) * 8) with t = (v - lo) / (hi - lo).
const RAMP = ["#2b1214", "#3b1719", "#5c1f22", "#8c2a2e", "#c93a3f", "#e5484d", "#ff6b6f", "#ff8a8d", "#ffd1d2"];

/** Hour x weekday grid, Monday first. The hottest cell gets a 2px outline. */
export function Heatmap({ grid }: { grid: (number | null)[][] }) {
  const values = grid.flat().filter((v): v is number => v !== null);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return (
    <>
      <div
        role="img"
        aria-label={`Fraud rate by hour and weekday, from ${pct(lo)} to ${pct(hi)}.`}
        className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-0.5 overflow-x-auto text-[10px]"
      >
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center font-mono text-foreground/60">{h}</span>
        ))}
        {grid.map((row, d) => (
          <div key={DAYS[d]} className="contents">
            <span className="flex items-center text-[11px] text-foreground/60">{DAYS[d]}</span>
            {row.map((v, h) => {
              const t = v === null ? 0 : (v - lo) / (hi - lo);
              return (
                <div
                  key={h}
                  title={`${DAYS[d]} ${h}:00 — ${v === null ? "no data" : pct(v, 2)}`}
                  className="h-6"
                  style={{
                    background: v === null ? "transparent" : RAMP[Math.min(8, Math.round(Math.sqrt(t) * 8))],
                    outline: v === hi ? "2px solid #ededed" : "none",
                    outlineOffset: -1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-foreground/60">
        <span>{pct(lo)}</span>
        <div className="flex h-2 w-[180px]" aria-hidden>
          {RAMP.map((c) => (
            <span key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <span>{pct(hi)}</span>
      </div>
    </>
  );
}
