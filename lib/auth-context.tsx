"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  getStoredAuth,
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

  // Restore session from localStorage
  useEffect(() => {
    const saved = getStoredAuth();
    if (saved.token && saved.wallet) {
      setAddress(saved.wallet);
      setToken(saved.token);
      setPro(saved.pro);
      setTier(saved.tier);
      // Re-check pro status in background
      checkProStatus(saved.wallet, saved.token).then(({ pro: p, tier: t }) => {
        setPro(p);
        setTier(t);
      }).catch(() => {});
    }
  }, []);

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
      // Discover wallets if not already done
      let wallets = getDiscoveredWallets();
      if (wallets.length === 0) {
        wallets = await discoverWallets();
      }

      if (wallets.length === 0) {
        redirectToWallet();
        return;
      }

      // Use connectWallet from thryx-auth (handles auth + chain switch)
      const result = await connectWallet(wallets[0].provider);
      setAddress(result.address);
      setToken(result.token);
      setPro(result.pro);
      setTier(result.tier);
    } catch (e: any) {
      console.error("Connect error:", e);
      if (e?.code !== 4001) {
        // Don't alert on user rejection
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
