import { explorerRows } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function isRateCol(name: string) {
  return name.toLowerCase().includes("rate") || name.startsWith("is_");
}

export default async function ExplorerPage() {
  const rows = await explorerRows();
  const cols = rows.length ? Object.keys(rows[0]) : [];

  function format(col: string, v: string | number | boolean | null): string {
    if (v === null) return "";
    if (typeof v !== "number") return String(v);
    if (col === "purchase_amount") return usd.format(v);
    if (isRateCol(col)) return v.toFixed(3);
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  }

  return (
    <>
      <h1>Data Explorer</h1>
      <p className="muted">First {rows.length} rows of the feature matrix.</p>
      <div className="scroll">
        <table className="table">
          <thead>
            <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c} className={typeof r[c] === "number" ? "num" : undefined}>
                    {format(c, r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
