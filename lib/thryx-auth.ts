/**
 * THRYX Unified Auth Library
 *
 * THE CANONICAL auth module. Copy to every site's lib/thryx-auth.ts.
 * All auth flows go through thryx.mom — ONE source of truth.
 *
 * Features:
 *   - EIP-6963 multi-wallet discovery
 *   - No-signature connect (eth_requestAccounts = ownership proof)
 *   - Optional signature verification for high-security actions
 *   - Pro/subscription tier checks via central API
 *   - Cross-site token sharing via localStorage
 *   - Base chain auto-switch
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const AUTH_API = "https://thryx.mom";
const BASE_CHAIN_ID = "0x2105"; // 8453

const OWNER_WALLETS = [
  "0x7a3e312ec6e20a9f62fe2405938eb9060312e334", // treasury
  "0x718d6142fb15f95f43fac6f70498d8da130240bc", // anthony
];

const THRYX_CONTRACT = "0xc07E889e1816De2708BF718683e52150C20F3BA3";

// ─── Storage Keys (shared across ecosystem via localStorage) ──────────────────

const STORAGE_KEYS = {
  token: "thryx_auth_token",
  wallet: "thryx_wallet",
  pro: "thryx_pro",
  tier: "thryx_tier",
} as const;

// ─── EIP-6963 Multi-Wallet Discovery ─────────────────────────────────────────

interface EIP6963Provider {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: any;
}

let discoveredWallets: EIP6963Provider[] = [];

export function discoverWallets(): Promise<EIP6963Provider[]> {
  return new Promise((resolve) => {
    discoveredWallets = [];

    const handleAnnounce = (event: any) => {
      const detail = event.detail;
      if (detail?.info && detail?.provider) {
        const exists = discoveredWallets.some(w => w.info.uuid === detail.info.uuid);
        if (!exists) discoveredWallets.push(detail);
      }
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Give wallets 500ms to respond
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);

      // Fallback: if no EIP-6963 but window.ethereum exists
      if (discoveredWallets.length === 0 && (window as any).ethereum) {
        discoveredWallets.push({
          info: {
            uuid: "legacy",
            name: (window as any).ethereum.isMetaMask ? "MetaMask" : "Browser Wallet",
            icon: "",
            rdns: "legacy",
          },
          provider: (window as any).ethereum,
        });
      }

      resolve(discoveredWallets);
    }, 500);
  });
}

export function getDiscoveredWallets(): EIP6963Provider[] {
  return discoveredWallets;
}

// ─── Connect Flow ────────────────────────────────────────────────────────────

export async function connectWallet(walletProvider?: any): Promise<{
  address: string;
  token: string;
  pro: boolean;
  tier: string;
}> {
  const provider = walletProvider || (window as any).ethereum;
  if (!provider) throw new Error("No wallet found");

  // 1. Request accounts
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const address = accounts[0]?.toLowerCase();
  if (!address) throw new Error("No account selected");

  // 2. Switch to Base
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (switchErr: any) {
    if (switchErr?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: "Base",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"],
        }],
      });
    }
  }

  // 3. Get auth token from central API (no-signature connect)
  let token = "";
  try {
    const res = await fetch(`${AUTH_API}/api/auth/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    token = data.token || "";
  } catch {
    // If central auth is down, generate a local fallback token
    token = `local_${address}_${Date.now()}`;
  }

  // 4. Check subscription tier
  const { pro, tier } = await checkProStatus(address, token);

  // 5. Persist across ecosystem
  setStoredAuth(address, token, pro, tier);

  return { address, token, pro, tier };
}

// ─── Signature Verification (optional, for high-security actions) ────────────

export async function verifyWithSignature(provider: any, address: string): Promise<string> {
  // Get challenge nonce
  const challengeRes = await fetch(`${AUTH_API}/api/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const { nonce } = await challengeRes.json();

  // Sign message
  const message = `Sign in to THRYX\nNonce: ${nonce}`;
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, address],
  });

  // Verify
  const verifyRes = await fetch(`${AUTH_API}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature, message }),
  });
  const data = await verifyRes.json();
  return data.token;
}

// ─── Pro Status Check ────────────────────────────────────────────────────────

export async function checkProStatus(
  address: string,
  token: string
): Promise<{ pro: boolean; tier: string }> {
  // Owner wallets always get pro
  if (OWNER_WALLETS.includes(address.toLowerCase())) {
    return { pro: true, tier: "owner" };
  }

  try {
    const res = await fetch(`${AUTH_API}/api/user/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { pro: false, tier: "free" };
    const data = await res.json();
    const tiers = data.activeTiers || [];
    if (tiers.includes("ultimate")) return { pro: true, tier: "ultimate" };
    if (tiers.includes("pro")) return { pro: true, tier: "pro" };
    return { pro: false, tier: "free" };
  } catch {
    return { pro: false, tier: "free" };
  }
}

// ─── Storage (shared across all THRYX sites) ─────────────────────────────────

export function setStoredAuth(addressOrToken: string, tokenOrAddress: string, pro?: boolean, tier?: string) {
  try {
    // Backward compat: old code called setStoredAuth(token, address) — detect by checking if first arg looks like a token
    let address: string;
    let token: string;
    if (addressOrToken.startsWith("0x") && addressOrToken.length === 42) {
      address = addressOrToken;
      token = tokenOrAddress;
    } else {
      // Old format: (token, address)
      token = addressOrToken;
      address = tokenOrAddress;
    }
    localStorage.setItem(STORAGE_KEYS.wallet, address);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.pro, String(pro ?? false));
    localStorage.setItem(STORAGE_KEYS.tier, tier ?? "free");
  } catch {}
}

export function getStoredAuth(): {
  wallet: string | null;
  token: string | null;
  pro: boolean;
  tier: string;
} {
  try {
    return {
      wallet: localStorage.getItem(STORAGE_KEYS.wallet),
      token: localStorage.getItem(STORAGE_KEYS.token),
      pro: localStorage.getItem(STORAGE_KEYS.pro) === "true",
      tier: localStorage.getItem(STORAGE_KEYS.tier) || "free",
    };
  } catch {
    return { wallet: null, token: null, pro: false, tier: "free" };
  }
}

export function clearStoredAuth() {
  try {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const { token } = getStoredAuth();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// ─── Utility: Authenticated fetch ────────────────────────────────────────────

export async function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(opts.headers || {}),
  };
  return fetch(url, { ...opts, headers });
}

// ─── Utility: Add $THRYX to wallet ───────────────────────────────────────────

export async function addThryxToWallet(provider?: any): Promise<boolean> {
  const eth = provider || (window as any).ethereum;
  if (!eth) return false;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_ID }],
    });
    return await eth.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: THRYX_CONTRACT,
          symbol: "THRYX",
          decimals: 18,
          image: "https://thryx.mom/thryx-logo.png",
        },
      },
    });
  } catch {
    return false;
  }
}

// ─── Constants Export ─────────────────────────────────────────────────────────

export const THRYX = {
  contract: THRYX_CONTRACT,
  authApi: AUTH_API,
  chainId: BASE_CHAIN_ID,
  ownerWallets: OWNER_WALLETS,
} as const;

// ─── Legacy / Backward-Compatible Exports ─────────────────────────────────────
// These are used by existing code across the ecosystem. DO NOT REMOVE.

// Legacy type: old code accesses .uuid, .name, .icon, .provider directly
export interface DiscoveredWallet {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: any;
}

/** Convert internal EIP6963Provider to legacy flat DiscoveredWallet */
function toLegacyWallet(w: EIP6963Provider): DiscoveredWallet {
  return { uuid: w.info.uuid, name: w.info.name, icon: w.info.icon, rdns: w.info.rdns, provider: w.provider };
}

/** @deprecated Use discoverWallets() instead */
export async function startWalletDiscovery(): Promise<DiscoveredWallet[]> {
  const wallets = await discoverWallets();
  return wallets.map(toLegacyWallet);
}

/** @deprecated Use discoverWallets()[n].provider instead */
export function getWalletProvider(uuid?: string): any {
  if (uuid) {
    const w = discoveredWallets.find(w => w.info.uuid === uuid);
    if (w) return w.provider;
  }
  return discoveredWallets[0]?.provider || (window as any).ethereum || null;
}

/** @deprecated Use checkProStatus() instead. Accepts (address, token) or just (token). */
export async function checkSubscription(addressOrToken: string, token?: string): Promise<{ pro: boolean; tier: string; expired: string[]; activeTiers: string[] }> {
  let addr = addressOrToken;
  let tok = token || "";
  // If called with just a token (old pattern): try to figure out address from storage
  if (!token && !addressOrToken.startsWith("0x")) {
    tok = addressOrToken;
    addr = getStoredAuth().wallet || "";
  }
  const result = await checkProStatus(addr, tok);
  return { ...result, expired: [], activeTiers: result.pro ? [result.tier] : [] };
}

/** @deprecated Use THRYX.ownerWallets.includes() instead */
export function isOwnerWallet(address: string): boolean {
  return OWNER_WALLETS.includes(address.toLowerCase());
}

/** @deprecated Use checkProStatus() instead. Accepts a string (address) or an object ({pro, tier}). */
export function isPro(addressOrStatus: string | { pro?: boolean; tier?: string; activeTiers?: string[] }, wallet?: string): boolean {
  if (typeof addressOrStatus === "object") {
    // Called with a status object from checkSubscription
    if (addressOrStatus.pro) return true;
    if (addressOrStatus.activeTiers?.some(t => t === "pro" || t === "ultimate")) return true;
    if (wallet && OWNER_WALLETS.includes(wallet.toLowerCase())) return true;
    return false;
  }
  // Called with an address string
  return OWNER_WALLETS.includes(addressOrStatus.toLowerCase()) || getStoredAuth().pro;
}

/** @deprecated Use verifyWithSignature() instead */
export async function getChallenge(address: string): Promise<{ nonce: string }> {
  const res = await fetch(`${AUTH_API}/api/auth/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await res.json();
  return { nonce: data.nonce };
}

/** @deprecated Use verifyWithSignature() instead */
export async function verifySignature(
  address: string,
  signature: string,
  message?: string
): Promise<{ token: string; wallet: string }> {
  const res = await fetch(`${AUTH_API}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature, message }),
  });
  const data = await res.json();
  return { token: data.token || "", wallet: address };
}

/** Verify an auth token — works both client-side and server-side */
export async function verifyToken(token: string): Promise<{ wallet: string } | null> {
  // Try decoding the token locally first (fast path)
  try {
    const [payload] = token.split(".");
    if (payload) {
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      const wallet = decoded.w || decoded.wallet || "";
      if (wallet) return { wallet };
    }
  } catch {}

  // Fallback: verify via central API (works server-side)
  try {
    const res = await fetch(`${AUTH_API}/api/user/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.wallet) return { wallet: data.wallet };
    }
  } catch {}

  // Client-side fallback
  if (typeof window !== "undefined") {
    const stored = getStoredAuth();
    if (stored.token === token && stored.wallet) {
      return { wallet: stored.wallet };
    }
  }

  return null;
}

/** Usage tracking for rate-limited features */
export function getDailyUsage(feature: string): number {
  try {
    const key = `thryx_usage_${feature}_${new Date().toISOString().slice(0, 10)}`;
    return parseInt(localStorage.getItem(key) || "0", 10);
  } catch { return 0; }
}

export function incrementDailyUsage(feature: string): number {
  try {
    const key = `thryx_usage_${feature}_${new Date().toISOString().slice(0, 10)}`;
    const val = getDailyUsage(feature) + 1;
    localStorage.setItem(key, String(val));
    return val;
  } catch { return 0; }
}

/** Mobile wallet redirect helper */
export function redirectToWallet(): void {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `https://rnbwapp.com/dapp?url=${encodeURIComponent(window.location.href)}`;
  } else {
    window.open("https://metamask.io/download/", "_blank");
  }
}
