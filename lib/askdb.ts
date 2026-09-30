import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";
import { dataPath } from "./duckdb";
import { ROW_LIMIT, TIMEOUT_MS } from "./askLimits";

/**
 * Read-only query path for "Ask the data" (SPEC invariant 2). Two independent layers:
 *   1. The connection: data/fraud.duckdb opened READ_ONLY, external access disabled and the
 *      configuration locked, so a query cannot write, read other files or change settings.
 *   2. The statement check: DuckDB's own parser (json_serialize_sql, which only accepts SELECT)
 *      must see exactly one statement.
 * A prompt is not a permission; neither layer depends on what the model was told.
 */


export type AskResult =
  | { sql: string; columns: string[]; rows: unknown[][]; rowCount: number; truncated: boolean }
  | { sql: string; error: string };

let connPromise: Promise<DuckDBConnection> | null = null;

function getConnection(): Promise<DuckDBConnection> {
  if (!connPromise) {
    connPromise = (async () => {
      const instance = await DuckDBInstance.create(dataPath("fraud.duckdb"), {
        access_mode: "READ_ONLY",
      });
      const conn = await instance.connect();
      // Order matters: lock_configuration last, or the SETs above it would be rejected.
      await conn.run("SET enable_external_access = false");
      await conn.run("SET lock_configuration = true");
      return conn;
    })();
    connPromise.catch(() => {
      connPromise = null;
    });
  }
  return connPromise;
}

/** Returns null when `sql` is exactly one SELECT (or WITH ... SELECT); otherwise the reason. */
async function checkSingleSelect(conn: DuckDBConnection, sql: string): Promise<string | null> {
  // json_serialize_sql only accepts a constant, so a bound parameter is rejected. The text is
  // embedded as a string literal (DuckDB has no backslash escapes, so doubling quotes suffices)
  // and is only parsed by this call, never executed.
  const literal = `'${sql.replace(/'/g, "''")}'`;
  const reader = await conn.runAndReadAll(`SELECT json_serialize_sql(${literal}) AS j`);
  const parsed = JSON.parse(String(reader.getRowObjects()[0].j));
  if (parsed.error) {
    return `Only a single SELECT statement is allowed (${parsed.error_message ?? "could not parse"}).`;
  }
  if (!Array.isArray(parsed.statements) || parsed.statements.length !== 1) {
    return "Only a single SELECT statement is allowed.";
  }
  return null;
}

function toJson(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") return v;
  return String(v);
}

export async function runReadOnlyQuery(rawSql: string): Promise<AskResult> {
  // A trailing semicolon is harmless, but it would break the LIMIT wrapper below.
  const sql = rawSql.trim().replace(/;+\s*$/, "");
  try {
    const conn = await getConnection();

    const rejection = await checkSingleSelect(conn, sql);
    if (rejection) return { sql: rawSql, error: rejection };

    // The newline keeps a trailing "-- comment" from swallowing the closing parenthesis.
    // Fetch one extra row so we can tell the caller the result was truncated.
    const wrapped = `SELECT * FROM (\n${sql}\n) LIMIT ${ROW_LIMIT + 1}`;
    const timer = setTimeout(() => conn.interrupt(), TIMEOUT_MS);
    try {
      const reader = await conn.runAndReadAll(wrapped);
      const all = reader.getRows();
      const truncated = all.length > ROW_LIMIT;
      const rows = all.slice(0, ROW_LIMIT).map((r) => r.map(toJson));
      return { sql: rawSql, columns: reader.columnNames(), rows, rowCount: rows.length, truncated };
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    return { sql: rawSql, error: e instanceof Error ? e.message : String(e) };
  }
}
