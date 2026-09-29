import path from "node:path";
import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";

// One in-memory instance per server process, reused across warm invocations.
let connPromise: Promise<DuckDBConnection> | null = null;

function getConnection(): Promise<DuckDBConnection> {
  if (!connPromise) {
    connPromise = DuckDBInstance.create(":memory:").then((i) => i.connect());
    connPromise.catch(() => {
      connPromise = null;
    });
  }
  return connPromise;
}

/** Absolute path to a file under ./data, resolved from the process working directory. */
export function dataPath(name: string): string {
  return path.join(process.cwd(), "data", name);
}

export type Row = Record<string, string | number | boolean | null>;

function toJson(v: unknown): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  return String(v);
}

/** Run a query and return plain JSON-safe rows (BIGINT becomes number). */
export async function query(sql: string): Promise<Row[]> {
  const conn = await getConnection();
  const reader = await conn.runAndReadAll(sql);
  return reader.getRowObjects().map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) out[k] = toJson(v);
    return out;
  });
}
