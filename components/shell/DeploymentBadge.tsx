"use client";

import { useEffect, useState } from "react";
import type { DeploymentInfo } from "@/lib/deployment";

/** `preview · a1b2c3d` / `production · a1b2c3d` / `local`, with the function region. Read from /api/deployment. */
export function DeploymentBadge() {
  const [d, setD] = useState<DeploymentInfo | null>(null);
  useEffect(() => {
    fetch("/api/deployment")
      .then((r) => (r.ok ? r.json() : null))
      .then(setD)
      .catch(() => setD(null));
  }, []);
  if (!d) return null;

  return (
    <div className="flex flex-col gap-0.5 font-mono text-[11px] text-foreground/70" data-testid="deployment-badge" title={d.message ?? undefined}>
      <span>
        {d.environment}
        {d.shortSha && (
          <>
            {" · "}
            {d.commitUrl ? (
              <a href={d.commitUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {d.shortSha}
              </a>
            ) : (
              d.shortSha
            )}
          </>
        )}
      </span>
      {d.region && <span>functions · {d.region}</span>}
    </div>
  );
}
