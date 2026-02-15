export default function Footer() {
  const ecosystemLinks = [
    { label: "thryx.mom", href: "https://thryx.mom" },
    { label: "Scanner", href: "https://scanner.thryx.mom" },
    { label: "Signals", href: "https://signals.thryx.mom" },
    { label: "Mint", href: "https://mint.thryx.mom" },
    { label: "API", href: "https://api.thryx.mom" },
    { label: "Portfolio", href: "https://portfolio.thryx.mom" },
    { label: "Sniper", href: "https://sniper.thryx.mom" },
    { label: "MySocial", href: "https://mysocial.mom", active: true },
  ];

  const productLinks = [
    { label: "Swap", href: "https://thryx.mom/swap" },
    { label: "Staking", href: "https://thryx.mom/staking" },
    { label: "Predictions", href: "https://thryx.mom/predict" },
    { label: "Lottery", href: "https://thryx.mom/lottery" },
  ];

  return (
    <footer className="eco-footer mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* Top section */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-black glitter-text">THRYX</span>
              <span className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5 font-medium">ECOSYSTEM</span>
            </div>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              DeFi tools, AI agents, and social — all powered by $THRYX on Base.
            </p>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 className="section-label mb-3">Ecosystem</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ecosystemLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.active ? undefined : "_blank"}
                  rel={link.active ? undefined : "noopener noreferrer"}
                  className={`eco-link ${link.active ? "active" : ""}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="section-label mb-3">Products</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {productLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="eco-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-white/20">
            <a href="https://x.com/THRYXAGI" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
              Twitter / X
            </a>
            <span>·</span>
            <a href="https://www.geckoterminal.com/base/pools/0x5a86f04dbd3e6b532e4397eb605a4c23136dc913e0a60b65547842d2ce7876e8" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
              CoinGecko
            </a>
            <span>·</span>
            <a href="https://dexscreener.com/base/0x5a86f04dbd3e6b532e4397eb605a4c23136dc913e0a60b65547842d2ce7876e8" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
              DexScreener
            </a>
          </div>
          <p className="text-xs text-white/15">
            Powered by $THRYX on Base
          </p>
        </div>
      </div>
    </footer>
  );
}
