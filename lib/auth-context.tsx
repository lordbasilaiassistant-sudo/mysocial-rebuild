"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
  checkSubscription,
  getChallenge,
  verifySignature,
  isPro,
  isOwnerWallet,
  startWalletDiscovery,
  getWalletProvider,
  redirectToWallet,
  DiscoveredWallet,
} from "@/lib/thryx-auth";

interface AuthState {
  address: string | null;
  token: string | null;
  pro: boolean;
  connecting: boolean;
  wallets: DiscoveredWallet[];
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthState>({
  address: null,
  token: null,
  pro: false,
  connecting: false,
  wallets: [],
  connect: async () => {},
  disconnect: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pro, setPro] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);

  // Start wallet discovery on mount
  useEffect(() => {
    startWalletDiscovery();
    // Give wallets a moment to announce themselves
    const timer = setTimeout(() => {
      const { wallets: discovered } = getWalletProvider();
      setWallets(discovered);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const checkStatus = useCallback(async (authToken: string, addr: string) => {
    try {
      const status = await checkSubscription(authToken);
      if (status.expired) {
        setAddress(null);
        setToken(null);
        setPro(false);
        clearStoredAuth();
        return;
      }
      setPro(isPro(status, addr));
    } catch {
      // Network error, keep existing state
    }
  }, []);

  // Restore from localStorage
  useEffect(() => {
    const saved = getStoredAuth();
    if (saved && saved.token && saved.wallet) {
      setAddress(saved.wallet);
      setToken(saved.token);
      checkStatus(saved.token, saved.wallet);
    }
  }, [checkStatus]);

  // Listen for account changes on any provider
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setToken(null);
        setPro(false);
        clearStoredAuth();
      }
    };
    eth.on("accountsChanged", handleAccountsChanged);
    return () => eth.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  const connectWithWallet = useCallback(async (selectedWallet?: DiscoveredWallet) => {
    setConnecting(true);
    try {
      // Get provider: use selected wallet, or auto-detect
      let provider: any = null;

      if (selectedWallet) {
        provider = selectedWallet.provider;
      } else {
        const { wallets: available } = getWalletProvider();
        setWallets(available);

        if (available.length === 0) {
          // No wallet found — redirect to install/dapp browser
          redirectToWallet();
          return;
        }

        if (available.length === 1) {
          provider = available[0].provider;
        } else {
          // Multiple wallets — pick first for now (could show picker)
          // On mobile in-app browsers, there's typically only one
          provider = available[0].provider;
        }
      }

      if (!provider) {
        redirectToWallet();
        return;
      }

      // Request accounts
      const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned");
      }
      const addr = accounts[0].toLowerCase();

      // Auth flow: challenge → sign → verify
      const { nonce } = await getChallenge(addr);
      const message = `Sign in to THRYX\nNonce: ${nonce}`;
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, addr],
      });

      const { token: authToken } = await verifySignature(addr, signature, nonce);

      setAddress(addr);
      setToken(authToken);
      setStoredAuth(authToken, addr);
      await checkStatus(authToken, addr);
    } catch (e: any) {
      console.error("Connect error:", e);
      if (e?.code === 4001) {
        // User rejected — silent
      } else if (e?.message?.includes("No accounts")) {
        alert("No wallet accounts found. Please unlock your wallet.");
      } else {
        alert("Connection failed. Make sure you have a Web3 wallet installed.");
      }
    } finally {
      setConnecting(false);
    }
  }, [checkStatus]);

  // Wrapper that ignores any event argument from onClick handlers
  const connect = useCallback(async () => {
    return connectWithWallet();
  }, [connectWithWallet]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setToken(null);
    setPro(false);
    clearStoredAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ address, token, pro, connecting, wallets, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
