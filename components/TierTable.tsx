import { THIS_DEPLOYMENT_TIER, TIER_COLUMNS, TIER_ROWS } from "@/lib/tiers";

/**
 * The Hobby / Pro / Enterprise table. `markCurrent` labels the column this deployment is on
 * (used on /governance); /intro shows it plain.
 */
export function TierTable({ markCurrent = false, large = false }: { markCurrent?: boolean; large?: boolean }) {
  const text = large ? "text-[15px] leading-[1.45]" : "text-[13px]";
  return (
    <div className="overflow-x-auto">
      <table className={`w-full min-w-[760px] border-collapse text-left ${text}`}>
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.08em] text-foreground/60">
            <th className="w-[130px] py-2 pr-4 font-medium" scope="col">
              <span className="sr-only">Topic</span>
            </th>
            {TIER_COLUMNS.map((c) => {
              const here = markCurrent && c.id === THIS_DEPLOYMENT_TIER;
              return (
                <th key={c.id} scope="col" className="py-2 pr-4 font-medium">
                  {c.heading}
                  {here && (
                    <span className="ml-2 rounded-full bg-signal-100 px-2 py-0.5 text-[10px] normal-case tracking-normal text-signal-pill">
                      this deployment
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {TIER_ROWS.map((r) => (
            <tr key={r.topic} className="border-t border-border align-top">
              <th scope="row" className="py-2.5 pr-4 text-[12px] font-medium uppercase tracking-[0.08em] text-foreground/60">
                {r.topic}
              </th>
              {TIER_COLUMNS.map((c) => (
                <td
                  key={c.id}
                  className={`py-2.5 pr-4 ${markCurrent && c.id === THIS_DEPLOYMENT_TIER ? "text-foreground" : "text-foreground/80"}`}
                >
                  {r[c.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
