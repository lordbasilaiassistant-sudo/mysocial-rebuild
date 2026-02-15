"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { getStoredAuth, setStoredAuth, clearStoredAuth, checkSubscription, getChallenge, verifySignature, isPro, isOwnerWallet } from "@/lib/thryx-auth";

interface AuthState {
  address: string | null;
  token: string | null;
  pro: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthState>({
  address: null,
  token: null,
  pro: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pro, setPro] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const checkStatus = useCallback(async (authToken: string, addr: string) => {
    const status = await checkSubscription(authToken);
    if (status.expired) {
      setAddress(null);
      setToken(null);
      setPro(false);
      return;
    }
    setPro(isPro(status, addr));
  }, []);

  // Restore from localStorage
  useEffect(() => {
    const saved = getStoredAuth();
    if (saved) {
      setAddress(saved.wallet);
      setToken(saved.token);
      checkStatus(saved.token, saved.wallet);
    }
  }, [checkStatus]);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
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

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return;
    }
    setConnecting(true);
    try {
      const eth = (window as any).ethereum;
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0].toLowerCase();

      const { nonce } = await getChallenge(addr);
      const message = `Sign in to THRYX\nNonce: ${nonce}`;
      const signature = await eth.request({
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
      if (e?.code !== 4001) {
        alert("Connection failed. Please try again.");
      }
    } finally {
      setConnecting(false);
    }
  }, [checkStatus]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setToken(null);
    setPro(false);
    clearStoredAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ address, token, pro, connecting, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
