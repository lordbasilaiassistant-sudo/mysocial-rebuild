"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ConnectWalletButton from "./ConnectWalletButton";

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/discover", label: "Discover" },
  { href: "/bulletins", label: "Bulletins" },
  { href: "/blog", label: "Blog" },
];

export default function MySpaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAuth();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/discover?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <div className="ms-topbar">
      <div className="ms-topbar-inner">
        {/* Logo */}
        <Link href="/" className="ms-logo">
          My<span className="ms-logo-accent">Social</span>
        </Link>

        {/* Nav */}
        <nav className="ms-nav">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
          {address && (
            <Link
              href={`/profile/${address}`}
              className={pathname.startsWith("/profile") ? "active" : ""}
            >
              Profile
            </Link>
          )}
        </nav>

        {/* Right side: search + wallet */}
        <div className="ms-topbar-actions">
          <form onSubmit={handleSearch} className="ms-search-bar">
            <span style={{ color: "rgba(255,255,255,0.5)", marginRight: 4, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>
          <ConnectWalletButton />
        </div>
      </div>
    </div>
  );
}
