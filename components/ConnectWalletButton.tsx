"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ConnectWalletButton() {
  const { address, pro, connecting, connect, disconnect } = useAuth();

  if (connecting) {
    return <button className="ms-btn ms-btn-sm" disabled>Connecting...</button>;
  }

  if (address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href={`/profile/${address}`}
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {address.slice(0, 6)}...{address.slice(-4)}
          {pro && <span className="ms-pro">PRO</span>}
        </Link>
        <button
          className="ms-btn ms-btn-sm"
          onClick={disconnect}
          style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, padding: "3px 8px" }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button className="ms-btn ms-btn-sm" onClick={connect}>
      Connect Wallet
    </button>
  );
}
