/**
 * What this deployment is, from Vercel system environment variables (docs: System environment
 * variables). Server side only; the badge and /governance get just these fields.
 * VERCEL_GIT_* are set only on git-triggered deployments, so a CLI deploy has no commit: it shows
 * "preview" with no SHA. VERCEL_REGION exists at runtime only.
 */
export type DeploymentInfo = {
  /** "production" | "preview" | "local" */
  environment: string;
  sha: string | null;
  shortSha: string | null;
  message: string | null;
  commitUrl: string | null;
  region: string | null;
};

export function deploymentInfo(): DeploymentInfo {
  const e = process.env;
  const environment = e.VERCEL ? (e.VERCEL_ENV === "production" ? "production" : "preview") : "local";
  const sha = e.VERCEL_GIT_COMMIT_SHA || null;
  const commitUrl =
    sha && e.VERCEL_GIT_PROVIDER === "github" && e.VERCEL_GIT_REPO_OWNER && e.VERCEL_GIT_REPO_SLUG
      ? `https://github.com/${e.VERCEL_GIT_REPO_OWNER}/${e.VERCEL_GIT_REPO_SLUG}/commit/${sha}`
      : null;
  return {
    environment,
    sha,
    shortSha: sha ? sha.slice(0, 7) : null,
    message: e.VERCEL_GIT_COMMIT_MESSAGE || null,
    commitUrl,
    region: e.VERCEL_REGION || null,
  };
}
