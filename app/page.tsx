"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const { address, connect, connecting } = useAuth();
  const [featured, setFeatured] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((d) => {
        setFeatured(d.profiles || []);
        setBulletins(d.bulletins || []);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: "Profiles", value: featured.length || "—" },
    { label: "Bulletins", value: bulletins.length || "—" },
    { label: "Network", value: "Base" },
  ];

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="hero-gradient relative min-h-[85vh] flex items-center justify-center">
        <div className="particle-field" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="animate-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live on Base
            </div>
          </div>

          <h1 className="animate-in delay-1 text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-6">
            <span className="glitter-text">MySocial</span>
          </h1>

          <p className="animate-in delay-2 text-lg sm:text-xl md:text-2xl text-white/40 font-light max-w-2xl mx-auto mb-3">
            The <span className="text-cyan-400 font-medium">MySpace</span> of Web3
          </p>

          <p className="animate-in delay-2 text-sm text-white/20 max-w-lg mx-auto mb-10">
            Customizable profiles · Top 8 friends · Bulletins · Vibes — all on-chain on Base
          </p>

          <div className="animate-in delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            {address ? (
              <Link href={`/profile/${address}`} className="btn-gradient text-base">
                <span>View My Profile →</span>
              </Link>
            ) : (
              <button onClick={connect} disabled={connecting} className="btn-gradient text-base">
                <span>{connecting ? "Connecting…" : "Connect Wallet"}</span>
              </button>
            )}
            <Link href="/bulletins" className="btn-glass text-base">
              Bulletin Board
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-in delay-4 flex justify-center gap-3 mt-14">
            {stats.map((s) => (
              <div key={s.label} className="stat-pill min-w-[100px]">
                <span className="text-xl font-bold text-white">{s.value}</span>
                <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030308] to-transparent" />
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center mb-12">
          <span className="section-label">What You Get</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">Your Space, On-Chain</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "👤", title: "Profiles", desc: "Customize your page — bio, theme, avatar, vibes. Make it yours." },
            { icon: "👥", title: "Top 8", desc: "Show off your on-chain besties. The OG social flex." },
            { icon: "📋", title: "Bulletins", desc: "Post updates to the public board. Speak your mind." },
            { icon: "🎵", title: "Now Playing", desc: "Show what track you're vibing to. The culture lives here." },
          ].map((f, i) => (
            <div key={f.title} className={`glass-card p-6 animate-in delay-${i + 1}`}>
              <div className="feature-icon mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-white/30 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURED PROFILES ═══════ */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="section-label">Trending</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Featured Profiles</h2>
            </div>
            <span className="text-xs text-white/20">Most visited</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p: any) => {
              const color = p.theme_color || "#06b6d4";
              return (
                <Link
                  key={p.wallet_address}
                  href={`/profile/${p.wallet_address}`}
                  className="glass-card p-5 group block"
                >
                  <div className="flex items-center gap-4 mb-3">
                    {/* Avatar with gradient ring */}
                    <div className="avatar-ring" style={{ "--accent": color, "--accent-alt": "#8b5cf6" } as any}>
                      <div className="avatar-ring-inner w-12 h-12 text-sm font-bold" style={{ color }}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          (p.display_name?.[0] || p.wallet_address[2] || "?").toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {p.display_name || shortAddr(p.wallet_address)}
                      </div>
                      <div className="text-xs text-white/20 font-mono">{shortAddr(p.wallet_address)}</div>
                    </div>
                    <div className="visitor-badge">
                      <span className="counter-num">{p.visitor_count || 0}</span>
                      <span className="text-white/20">views</span>
                    </div>
                  </div>
                  {p.listening_to && (
                    <div className="flex items-center gap-2 text-xs text-white/30 bg-white/3 rounded-lg px-3 py-2">
                      <span className="animate-rainbow">♫</span>
                      <span className="truncate">{p.listening_to}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════ RECENT BULLETINS ═══════ */}
      {bulletins.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="section-label">Feed</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Recent Bulletins</h2>
            </div>
            <Link href="/bulletins" className="text-xs text-cyan-400 hover:text-cyan-300 transition">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {bulletins.map((b: any) => (
              <div key={b.id} className="bulletin-card" style={{ "--accent-color": b.theme_color || "#06b6d4" } as any}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="avatar-ring flex-shrink-0"
                    style={{ "--accent": b.theme_color || "#06b6d4", "--accent-alt": "#8b5cf6" } as any}
                  >
                    <div className="avatar-ring-inner w-8 h-8 text-xs font-bold" style={{ color: b.theme_color || "#06b6d4" }}>
                      {(b.display_name?.[0] || b.wallet_address?.[2] || "?").toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${b.wallet_address}`}
                      className="text-sm font-medium hover:text-cyan-400 transition-colors"
                      style={{ color: b.theme_color || "#06b6d4" }}
                    >
                      {b.display_name || shortAddr(b.wallet_address)}
                    </Link>
                    <span className="text-white/15 mx-2">·</span>
                    <span className="text-xs text-white/20">{timeAgo(b.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed pl-11">{b.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ CTA ═══════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        <div className="gradient-border p-8 md:p-12 text-center animate-pulse-glow">
          <div className="text-3xl mb-4 animate-float">⚡</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Powered by <span className="text-cyan-400">$THRYX</span>
          </h2>
          <p className="text-sm text-white/30 mb-6 max-w-md mx-auto">
            The token behind the THRYX ecosystem — DeFi, AI, social, all on Base.
          </p>
          <a
            href="https://thryx.mom/swap"
            target="_blank"
            rel="noopener"
            className="btn-gradient"
          >
            <span>Get $THRYX →</span>
          </a>
        </div>
      </section>
    </div>
  );
}
