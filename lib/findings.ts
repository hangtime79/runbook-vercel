import { readDoc } from "./docs";

export type VarianceRow = { rank: number; dimension: string; range: number; note: string };
export type Typology = { name: string; present: string; evidence: string };

// Markdown cell text -> plain text: drop bold markers and backticks.
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/`/g, "").trim();

/** The rows of the first markdown table after `heading` (a line starting with that text). */
function tableAfter(md: string, heading: string): string[][] {
  const start = md.indexOf(heading);
  if (start < 0) return [];
  const rows: string[][] = [];
  for (const line of md.slice(start).split("\n").slice(1)) {
    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
    } else if (rows.length) break;
  }
  return rows.slice(1); // drop the header row
}

/** Variance ranking, ranks 1-10, read from findings.md so the numbers are the analysis's own. */
export async function varianceRanking(): Promise<VarianceRow[]> {
  const md = await readDoc("findings.md");
  return tableAfter(md, "## Variance ranking")
    .filter((r) => /^\d+$/.test(r[0]))
    .map((r) => ({
      rank: Number(r[0]),
      dimension: plain(r[1]).replace(/\s*\(.*\)$/, ""),
      range: parseFloat(plain(r[2])),
      note: plain(r[3]).replace(/\s*—\s*see Finding \d+/, ""),
    }));
}

export async function typologies(): Promise<Typology[]> {
  const md = await readDoc("findings.md");
  return tableAfter(md, "## Typology inventory").map((r) => ({
    name: plain(r[0]),
    present: plain(r[1]).split(/\s|\(/)[0], // "No (spurious)" -> "No"
    evidence: plain(r[2]),
  }));
}

/** "55× spread" from the Pass 1 verification table: the merchant_fraud_rate trigger. */
export async function merchantSpread(): Promise<number> {
  const md = await readDoc("findings.md");
  const m = md.match(/(\d+)× spread/);
  return m ? Number(m[1]) : NaN;
}
