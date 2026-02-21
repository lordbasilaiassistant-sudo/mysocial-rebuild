"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  connectWallet,
  discoverWallets,
  getDiscoveredWallets,
  checkProStatus,
  redirectToWallet,
} from "@/lib/thryx-auth";

interface AuthState {
  address: string | null;
  token: string | null;
  pro: boolean;
  tier: string;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthState>({
  address: null,
  token: null,
  pro: false,
  tier: "free",
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pro, setPro] = useState(false);
  const [tier, setTier] = useState("free");
  const [connecting, setConnecting] = useState(false);

  // Discover wallets on mount
  useEffect(() => {
    discoverWallets().catch(() => {});
  }, []);

  // Restore session from localStorage — wallet alone is enough
  useEffect(() => {
    const saved = getStoredAuth();
    if (saved.wallet) {
      setAddress(saved.wallet);
      setToken(saved.token);
      setPro(saved.pro);
      setTier(saved.tier);

      // Try to silently reconnect to refresh token if missing
      if (!saved.token) {
        silentReconnect(saved.wallet);
      } else {
        // Re-check pro status in background
        checkProStatus(saved.wallet, saved.token).then(({ pro: p, tier: t }) => {
          setPro(p);
          setTier(t);
        }).catch(() => {});
      }
    }
  }, []);

  // Silent reconnect: if wallet is in localStorage but token is missing,
  // try to get a fresh token from thryx.mom without user interaction
  async function silentReconnect(wallet: string) {
    try {
      // Wait for wallet discovery
      let wallets = getDiscoveredWallets();
      if (wallets.length === 0) {
        wallets = await discoverWallets();
      }
      if (wallets.length === 0) return;

      // Check if wallet is still connected (no popup)
      const provider = wallets[0].provider;
      const accounts: string[] = await provider.request({ method: "eth_accounts" });
      const connected = accounts.find((a: string) => a.toLowerCase() === wallet.toLowerCase());
      if (!connected) return;

      // Get fresh token from thryx.mom
      try {
        const res = await fetch("https://thryx.mom/api/auth/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: wallet }),
        });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          const { pro: p, tier: t } = await checkProStatus(wallet, data.token);
          setPro(p);
          setTier(t);
          setStoredAuth(wallet, data.token, p, t);
        }
      } catch {
        // Token refresh failed, but wallet is still connected — that's fine
        const fallbackToken = `local_${wallet}_${Date.now()}`;
        setToken(fallbackToken);
        setStoredAuth(wallet, fallbackToken, pro, tier);
      }
    } catch {}
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setToken(null);
        setPro(false);
        setTier("free");
        clearStoredAuth();
      }
    };
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      let wallets = getDiscoveredWallets();
      if (wallets.length === 0) {
        wallets = await discoverWallets();
      }

      if (wallets.length === 0) {
        redirectToWallet();
        return;
      }

      const result = await connectWallet(wallets[0].provider);
      setAddress(result.address);
      setToken(result.token);
      setPro(result.pro);
      setTier(result.tier);
    } catch (e: any) {
      console.error("Connect error:", e);
      if (e?.code !== 4001) {
        console.warn("Wallet connection failed:", e?.message);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setToken(null);
    setPro(false);
    setTier("free");
    clearStoredAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ address, token, pro, tier, connecting, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
