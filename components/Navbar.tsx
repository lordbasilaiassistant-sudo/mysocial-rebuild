"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function Navbar() {
  const { address, connecting, connect, disconnect, pro } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-8 left-0 right-0 z-50 nav-glass transition-all duration-300 ${scrolled ? "shadow-lg shadow-black/20" : ""}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-lg font-black tracking-tight">
            <span className="glitter-text">MySocial</span>
          </span>
          <span className="text-[10px] font-medium text-white/20 hidden sm:inline border border-white/10 rounded px-1.5 py-0.5">
            by THRYX
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200">
            Home
          </Link>
          <Link href="/bulletins" className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200">
            Bulletins
          </Link>
          {address && (
            <>
              <Link href={`/profile/${address}`} className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200">
                My Profile
              </Link>
              <Link href="/edit" className="px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200">
                Edit
              </Link>
            </>
          )}
          <div className="w-px h-4 bg-white/10 mx-2" />
          <a href="https://thryx.mom" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-sm text-white/30 hover:text-white/60 transition-all duration-200">
            thryx.mom ↗
          </a>
        </div>

        {/* Right: wallet + mobile menu */}
        <div className="flex items-center gap-2">
          {address ? (
            <div className="flex items-center gap-2">
              {pro && (
                <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                  PRO
                </span>
              )}
              <button
                onClick={disconnect}
                className="px-3 py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 font-mono transition-all duration-200 border border-white/5 hover:border-white/10"
              >
                {shortAddr(address)}
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="btn-gradient text-sm !py-2 !px-5"
            >
              <span>{connecting ? "Connecting…" : "Connect Wallet"}</span>
            </button>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {menuOpen ? (
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#030308]/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-1 z-40">
          <Link href="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
            Home
          </Link>
          <Link href="/bulletins" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
            Bulletins
          </Link>
          {address && (
            <>
              <Link href={`/profile/${address}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                My Profile
              </Link>
              <Link href="/edit" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                Edit Profile
              </Link>
            </>
          )}
          <div className="border-t border-white/5 my-2" />
          <a href="https://thryx.mom" target="_blank" className="block px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-white/60 transition-all">
            thryx.mom ↗
          </a>
        </div>
      )}
    </nav>
  );
}
