"use client";

/**
 * THRYX Ecosystem Navigation Bar
 *
 * Drop this into EVERY site in the ecosystem. It renders a slim top bar
 * that shows all ecosystem sites, highlights the current one, and provides
 * unified wallet state. Place ABOVE the site's own navbar.
 *
 * Usage in layout.tsx:
 *   import EcosystemBar from "@/components/EcosystemBar";
 *   <EcosystemBar currentSite="hub" />  // or "mint", "social", "signals", "scanner", "api", "portfolio", "sniper"
 */

import { useEffect, useState } from "react";

const SITES = [
  { key: "hub",       label: "Hub",       href: "https://thryx.mom",              icon: "⚡" },
  { key: "mint",      label: "Mint",      href: "https://mint.thryx.mom",         icon: "🎨" },
  { key: "signals",   label: "Signals",   href: "https://signals.thryx.mom",      icon: "📡" },
  { key: "scanner",   label: "Scanner",   href: "https://basescan.thryx.mom",     icon: "🔍" },
  { key: "social",    label: "Social",    href: "https://mysocial.mom",           icon: "👥" },
  { key: "api",       label: "API",       href: "https://api.thryx.mom",          icon: "🔌" },
  { key: "portfolio", label: "Portfolio", href: "https://portfolio.thryx.mom",    icon: "💼" },
  { key: "sniper",    label: "Sniper",    href: "https://sniper.thryx.mom",       icon: "🎯" },
] as const;

type SiteKey = typeof SITES[number]["key"];

interface EcosystemBarProps {
  currentSite: SiteKey;
}

export default function EcosystemBar({ currentSite }: EcosystemBarProps) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    // Read shared wallet from localStorage (set by any THRYX site)
    const stored = localStorage.getItem("thryx_wallet");
    if (stored) setWallet(stored);

    // Listen for wallet changes across the ecosystem
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "thryx_wallet") setWallet(e.newValue);
    };
    window.addEventListener("storage", handleStorage);

    // Fetch live price (cached, lightweight)
    fetch("https://thryx.mom/api/price")
      .then(r => r.json())
      .then(d => {
        if (d?.price) setPrice(`$${Number(d.price).toFixed(10)}`);
      })
      .catch(() => {});

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div
      className="w-full z-[100] border-b select-none"
      style={{
        background: "var(--void, #09090b)",
        borderColor: "var(--border, rgba(255,255,255,0.06))",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="max-w-7xl mx-auto px-3 h-8 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {/* Left: Ecosystem sites */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest mr-2" style={{ color: "var(--text-muted, #3c3c48)" }}>
            THRYX
          </span>
          {SITES.map(site => {
            const isCurrent = site.key === currentSite;
            return (
              <a
                key={site.key}
                href={site.href}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: isCurrent ? "var(--surface-2, #1c1c22)" : "transparent",
                  color: isCurrent ? "var(--text-primary, #f0f0f2)" : "var(--text-tertiary, #52525e)",
                  borderBottom: isCurrent ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                }}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="text-[10px]">{site.icon}</span>
                <span className="hidden sm:inline">{site.label}</span>
              </a>
            );
          })}
        </div>

        {/* Right: Price + wallet indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {price && (
            <span className="text-[10px] font-mono" style={{ color: "var(--pulse, #22c55e)" }}>
              $THRYX {price}
            </span>
          )}
          {wallet && (
            <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary, #52525e)" }}>
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </span>
          )}
          {!wallet && (
            <a
              href="https://thryx.mom"
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{
                background: "var(--accent, #6366f1)",
                color: "white",
              }}
            >
              Connect
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
