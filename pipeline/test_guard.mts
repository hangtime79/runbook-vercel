// The read-only guard behind "Ask the data" (SPEC invariant 2): writes are refused, a SELECT runs.
// Usage: node --no-warnings pipeline/test_guard.mts   (from the repo root; needs data/fraud.duckdb)
// Calls lib/askdb.ts's runReadOnlyQuery directly: no model, no network, no secrets.
import assert from "node:assert/strict";
import { runReadOnlyQuery } from "../lib/askdb.ts";

const refused: [string, string][] = [
  ["DELETE", "DELETE FROM golden_record"],
  ["multi-statement", "SELECT 1; SELECT 2"],
  ["ATTACH", "ATTACH '/tmp/other.duckdb' AS other"],
  ["COPY ... TO", "COPY (SELECT 1) TO '/tmp/guard_test_out.csv'"],
];

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed++;
};

const before = await runReadOnlyQuery("SELECT count(*) AS n FROM golden_record");
assert.ok(!("error" in before), "the table count must be readable before the write attempts");

for (const [name, sql] of refused) {
  const r = await runReadOnlyQuery(sql);
  check("error" in r, `${name} rejected${"error" in r ? `: ${r.error.slice(0, 80)}` : " (it ran!)"}`);
}

const select = await runReadOnlyQuery("SELECT 1 AS one");
check(!("error" in select) && select.rows[0]?.[0] === 1, "a valid SELECT runs and returns its row");

const after = await runReadOnlyQuery("SELECT count(*) AS n FROM golden_record");
check(
  !("error" in before) && !("error" in after) && before.rows[0][0] === after.rows[0][0],
  `golden_record row count unchanged after the attempts (${"rows" in after ? after.rows[0][0] : "?"})`
);

process.exit(failed ? 1 : 0);
