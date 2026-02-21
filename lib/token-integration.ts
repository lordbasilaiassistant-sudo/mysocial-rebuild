import { THRYX_API } from "./constants";
import { getAuthHeaders } from "./thryx-auth";

const MEMEMINT_API = `${THRYX_API}/api/mememint`;

export type DeployMethod = "bankr" | "thryx";

export async function deployToken(opts: {
  name: string;
  symbol: string;
  description: string;
  walletAddress: string;
  imageUrl?: string;
  website?: string;
  deployMethod?: DeployMethod;
}): Promise<{ submitted: boolean; jobId: string }> {
  const method = opts.deployMethod || "bankr";

  if (method === "thryx") {
    throw new Error("THRYX Coin Factory is coming soon! Use Bankr for now.");
  }

  // Bankr deployment via thryx.mom gateway
  const res = await fetch(`${MEMEMINT_API}/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      name: opts.name,
      symbol: opts.symbol,
      description: opts.description,
      walletAddress: opts.walletAddress,
      imageUrl: opts.imageUrl || null,
      website: opts.website || "https://mysocial.mom",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Deploy failed" }));
    throw new Error(err.error || `Deploy failed (${res.status})`);
  }
  return res.json();
}

export async function checkDeployStatus(jobId: string): Promise<{
  status: string;
  tokenAddress?: string;
  error?: string;
}> {
  const res = await fetch(`${MEMEMINT_API}/deploy/status?jobId=${jobId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { status: "unknown" };
  return res.json();
}

export function pollDeployStatus(
  jobId: string,
  onUpdate: (status: { status: string; tokenAddress?: string }) => void,
  intervalMs = 3000,
  maxAttempts = 60
): () => void {
  let attempts = 0;
  let cancelled = false;

  const poll = async () => {
    if (cancelled || attempts >= maxAttempts) return;
    attempts++;
    try {
      const result = await checkDeployStatus(jobId);
      onUpdate(result);
      if (result.status === "completed" || result.status === "failed") return;
    } catch {}
    if (!cancelled) setTimeout(poll, intervalMs);
  };

  poll();
  return () => { cancelled = true; };
}
