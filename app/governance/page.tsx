import { Figure, FigureLabel } from "@/components/Figure";
import { Page, PageHeader } from "@/components/PageHeader";
import { TierTable } from "@/components/TierTable";
import { ALLOWED_MODELS, DEFAULT_MODEL, pickModel, zdrEnabled } from "@/lib/askConfig";
import { ROW_LIMIT, TIMEOUT_MS } from "@/lib/askLimits";
import { deploymentInfo } from "@/lib/deployment";
import guardrails from "@/lib/guardrails/config.json";
import { GOVERNANCE as G } from "@/lib/governanceCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = "https://github.com/hangtime79/runbook-vercel";

function Row({ k, children, basis }: { k: string; children: React.ReactNode; basis?: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-border py-2.5 text-[14px] sm:grid-cols-[180px_1fr]">
      <span className="text-[12px] uppercase tracking-[0.08em] text-foreground/60">{k}</span>
      <span className="min-w-0 text-pretty">
        {children}
        {basis && <span className="ml-2 font-mono text-[11px] text-foreground/55">[{basis}]</span>}
      </span>
    </div>
  );
}

export default function GovernancePage() {
  const d = deploymentInfo();
  const zdr = zdrEnabled();
  const active = pickModel(undefined);

  return (
    <Page>
      <PageHeader kicker={G.kicker} title={G.title} lede={G.lede} />

      <Figure className="px-5 py-4" data-xray="where-runs">
        <FigureLabel>Deployment</FigureLabel>
        <Row k="Environment" basis="live">{d.environment}</Row>
        <Row k="Commit" basis="live">
          {d.shortSha ? (
            <>
              {d.commitUrl ? (
                <a href={d.commitUrl} target="_blank" rel="noreferrer" className="font-mono underline underline-offset-2">
                  {d.shortSha}
                </a>
              ) : (
                <span className="font-mono">{d.shortSha}</span>
              )}
              {d.message && <span className="text-foreground/70"> · {d.message}</span>}
            </>
          ) : (
            <span className="text-foreground/70">none (not a git-triggered deployment)</span>
          )}
        </Row>
        <Row k="Function region" basis="live">
          {d.region ? <span className="font-mono">{d.region}</span> : <span className="text-foreground/70">not reported (local run)</span>}
        </Row>
      </Figure>

      <Figure className="px-5 py-4" data-xray="who-sees">
        <FigureLabel>{G.access.title}</FigureLabel>
        <Row k="Who can open it" basis={G.access.basis}>{G.access.value}</Row>
        <Row k="Enterprise option">{G.access.note}</Row>
      </Figure>

      <Figure className="px-5 py-4" data-xray="connect">
        <FigureLabel>Data</FigureLabel>
        <Row k="Source" basis="live">DuckDB file <span className="font-mono">fraud.duckdb</span>, opened read-only with external access off and configuration locked</Row>
        <Row k="Statement guard" basis="live">Exactly one SELECT (parsed by DuckDB) or the query is refused</Row>
        <Row k="Limits" basis="live">{ROW_LIMIT} rows per result · {TIMEOUT_MS / 1000} s timeout</Row>
      </Figure>

      <Figure className="px-5 py-4" data-xray="ai-called">
        <FigureLabel>AI usage</FigureLabel>
        <Row k="Allowed models" basis="live">
          <span className="font-mono">{ALLOWED_MODELS.map((m) => m.id).join(" · ")}</span>
        </Row>
        <Row k="Answering now" basis="live"><span className="font-mono">{active}</span>{active === DEFAULT_MODEL ? " (default)" : ""}</Row>
        <Row k="Data retention" basis="live">{zdr ? G.ai.zdrOn : G.ai.zdrOff}</Row>
        <Row k="Credential" basis={G.ai.credentialBasis}>{G.ai.credential}</Row>
        <Row k="What the AI can do">{G.ai.can}</Row>
        <Row k="Scope check" basis="live">
          <span className="font-mono">{guardrails.model}</span> · {G.ai.scope}
        </Row>
      </Figure>

      <Figure className="px-5 py-4" data-xray="change-propose change-checks ship-undo">
        <FigureLabel>{G.changeControl.title}</FigureLabel>
        <p className="m-0 pb-2 text-[14px] text-foreground/75">{G.changeControl.lede}</p>
        {G.changeControl.checks.map((c) => (
          <Row key={c.name} k={c.name}>{c.what}</Row>
        ))}
        <Row k="Defined in">
          <a href={`${REPO}/blob/main/${G.changeControl.workflowPath}`} target="_blank" rel="noreferrer" className="font-mono underline underline-offset-2">
            {G.changeControl.workflowPath}
          </a>
        </Row>
        <p className="m-0 pt-2 text-[13px] text-foreground/65">{G.changeControl.note}</p>
      </Figure>

      <Figure className="px-5 py-4" data-xray="close-tiers">
        <FigureLabel>{G.tiers.title}</FigureLabel>
        <p className="m-0 pb-2 text-[14px] text-foreground/75">{G.tiers.lede}</p>
        <TierTable markCurrent />
        <p className="m-0 pt-2 text-[13px] text-foreground/65">{G.tiers.note}</p>
      </Figure>

      <Figure className="px-5 py-4">
        <FigureLabel>{G.apra.title}</FigureLabel>
        <p className="m-0 pb-2 text-[12px] text-signal-700">{G.apra.note}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.08em] text-foreground/60">
                <th className="py-2 pr-4 font-medium">APRA source</th>
                <th className="py-2 pr-4 font-medium">What it asks</th>
                <th className="py-2 font-medium">What this shows</th>
              </tr>
            </thead>
            <tbody>
              {G.apra.rows.map((r) => (
                <tr key={r.source} className="border-t border-border align-top">
                  <td className="py-2 pr-4 font-medium">{r.source}</td>
                  <td className="py-2 pr-4 text-foreground/80">{r.asks}</td>
                  <td className="py-2 text-foreground/80">{r.shows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Figure>

      <Figure className="px-5 py-4">
        <FigureLabel>{G.gaps.title}</FigureLabel>
        {G.gaps.rows.map((g) => (
          <Row key={g.gap} k={g.gap}>{g.text}</Row>
        ))}
      </Figure>
    </Page>
  );
}
