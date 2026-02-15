/**
 * THRYX Unified Auth — drop into any ecosystem site
 * All auth goes through thryx.mom central API
 * Copy this file to src/lib/thryx-auth.ts in any THRYX ecosystem project
 */

const AUTH_API = 'https://thryx.mom';

// Owner wallets always get Pro (client-side fast check)
const OWNER_WALLETS = [
  '0x7a3e312ec6e20a9f62fe2405938eb9060312e334',
  '0x718d6142fb15f95f43fac6f70498d8da130240bc',
].map(w => w.toLowerCase());

export function isOwnerWallet(wallet: string | null): boolean {
  if (!wallet) return false;
  return OWNER_WALLETS.includes(wallet.toLowerCase());
}

export async function checkSubscription(token: string) {
  try {
    const res = await fetch(`${AUTH_API}/api/user/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      clearStoredAuth();
      return { activeTiers: ['free'], expired: true };
    }
    if (!res.ok) return { activeTiers: ['free'] };
    return res.json();
  } catch {
    return { activeTiers: ['free'] };
  }
}

export async function getChallenge(walletAddress: string) {
  const res = await fetch(`${AUTH_API}/api/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  return res.json();
}

export async function verifySignature(walletAddress: string, signature: string, nonce: string) {
  const res = await fetch(`${AUTH_API}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, nonce })
  });
  return res.json();
}

export function getStoredAuth(): { token: string; wallet: string } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('thryx_auth_token');
  const wallet = localStorage.getItem('thryx_wallet');
  if (token && wallet) return { token, wallet };
  return null;
}

export function setStoredAuth(token: string, wallet: string) {
  localStorage.setItem('thryx_auth_token', token);
  localStorage.setItem('thryx_wallet', wallet);
}

export function clearStoredAuth() {
  localStorage.removeItem('thryx_auth_token');
  localStorage.removeItem('thryx_wallet');
}

export async function verifyToken(token: string): Promise<{ wallet: string; address: string } | null> {
  try {
    const res = await fetch(`${AUTH_API}/api/user/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.wallet) return { wallet: data.wallet, address: data.wallet };
    return null;
  } catch {
    return null;
  }
}

export function isPro(status: { activeTiers?: string[] }, wallet?: string | null): boolean {
  if (wallet && isOwnerWallet(wallet)) return true;
  return status?.activeTiers?.some((t: string) => t !== 'free') ?? false;
}

export function getDailyUsage(key: string): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toISOString().slice(0, 10);
  const stored = localStorage.getItem(`thryx_usage_${key}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) return parsed.count;
  }
  return 0;
}

export function incrementDailyUsage(key: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const current = getDailyUsage(key);
  const newCount = current + 1;
  localStorage.setItem(`thryx_usage_${key}`, JSON.stringify({ date: today, count: newCount }));
  return newCount;
}
