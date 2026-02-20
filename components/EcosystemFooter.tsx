"use client";

/**
 * THRYX Unified Ecosystem Footer
 *
 * Drop-in replacement for every site's footer. Identical on all sites.
 * Uses CSS variables from thryx-ecosystem.css for consistent theming.
 *
 * Usage: import EcosystemFooter from "@/components/EcosystemFooter";
 */

const THRYX_CA = "0xc07E889e1816De2708BF718683e52150C20F3BA3";

const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "Swap", href: "https://thryx.mom/swap" },
      { label: "Staking", href: "https://thryx.mom/staking" },
      { label: "Lottery", href: "https://thryx.mom/lottery" },
      { label: "Predictions", href: "https://thryx.mom/predict" },
      { label: "Bounties", href: "https://thryx.mom/bounties" },
      { label: "Name Service", href: "https://thryx.mom/names" },
    ],
  },
  {
    title: "Games",
    links: [
      { label: "Last Stand", href: "https://thryx.mom/last-stand" },
      { label: "Tribute Wars", href: "https://thryx.mom/tribute-wars" },
      { label: "Forge", href: "https://thryx.mom/forge" },
      { label: "Carnival", href: "https://thryx.mom/carnival" },
      { label: "Colosseum", href: "https://thryx.mom/colosseum" },
      { label: "Jackpot Chain", href: "https://thryx.mom/jackpot" },
      { label: "Garden", href: "https://thryx.mom/garden" },
      { label: "Vault Battles", href: "https://thryx.mom/vault-battles" },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "THRYX Hub", href: "https://thryx.mom" },
      { label: "MemeMint", href: "https://mint.thryx.mom" },
      { label: "Signals", href: "https://signals.thryx.mom" },
      { label: "AI Scanner", href: "https://basescan.thryx.mom" },
      { label: "MySocial", href: "https://mysocial.mom" },
      { label: "API Portal", href: "https://api.thryx.mom" },
      { label: "Portfolio", href: "https://portfolio.thryx.mom" },
      { label: "Sniper", href: "https://sniper.thryx.mom" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "CoinGecko", href: "https://www.coingecko.com/en/coins/thryx" },
      { label: "DexScreener", href: "https://dexscreener.com/base/0x5a86f04dbd3e6b532e4397eb605a4c23136dc913e0a60b65547842d2ce7876e8" },
      { label: "BaseScan", href: `https://basescan.org/token/${THRYX_CA}` },
      { label: "@THRYXAGI", href: "https://x.com/THRYXAGI" },
      { label: "API Docs", href: "https://api.thryx.mom/docs" },
    ],
  },
];

export default function EcosystemFooter() {
  return (
    <footer
      className="border-t py-12 mt-8"
      style={{
        borderColor: "var(--border, rgba(255,255,255,0.06))",
        background: "var(--surface-0, #0c0c10)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {FOOTER_SECTIONS.map(section => (
            <div key={section.title}>
              <h4
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary, #52525e)" }}
              >
                {section.title}
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                {section.links.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="hover:text-white transition"
                    style={{ color: "var(--text-secondary, #8b8b9e)" }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contract address */}
        <div className="mb-6">
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-tertiary, #52525e)" }}
          >
            $THRYX Contract (Base)
          </h4>
          <p
            className="text-xs font-mono break-all select-all cursor-pointer"
            style={{ color: "var(--text-tertiary, #52525e)" }}
            onClick={() => navigator.clipboard?.writeText(THRYX_CA)}
            title="Click to copy"
          >
            {THRYX_CA}
          </p>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--border, rgba(255,255,255,0.06))" }}
        >
          <div className="flex items-center gap-2">
            <img
              src="https://thryx.mom/thryx-logo.png"
              alt="THRYX"
              className="w-5 h-5 opacity-40"
            />
            <span className="text-sm" style={{ color: "var(--text-tertiary, #52525e)" }}>
              THRYX — AI Builder Agent on Base
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://thryx.mom/about"
              className="text-xs hover:text-white transition"
              style={{ color: "var(--text-muted, #3c3c48)" }}
            >
              About
            </a>
            <a
              href="https://thryx.mom/tokenomics"
              className="text-xs hover:text-white transition"
              style={{ color: "var(--text-muted, #3c3c48)" }}
            >
              Tokenomics
            </a>
            <span className="text-xs" style={{ color: "var(--text-muted, #3c3c48)" }}>
              Built on Base
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
