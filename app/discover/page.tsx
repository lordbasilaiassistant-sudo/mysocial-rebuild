"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DEFAULT_AVATAR } from "@/lib/constants";

interface Profile {
  wallet_address: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  visitor_count: number;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(queryParam);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/featured")
      .then(r => r.ok ? r.json() : { profiles: [] })
      .then(data => {
        setProfiles(data.profiles || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Simple client-side filter (will be server-side with proper search API later)
  const filtered = query.trim()
    ? profiles.filter(p =>
        p.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        p.wallet_address.toLowerCase().includes(query.toLowerCase()) ||
        p.bio?.toLowerCase().includes(query.toLowerCase())
      )
    : profiles;

  return (
    <div>
      {/* Search Bar */}
      <div className="ms-card" style={{ marginBottom: 16 }}>
        <div className="ms-card-body" style={{ display: "flex", gap: 8 }}>
          <input
            className="ms-input"
            type="text"
            placeholder="Search by name or wallet address..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="ms-btn ms-btn-blue" onClick={() => {}}>
            Search
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#003375" }}>
          {query ? `Results for "${query}"` : "Discover People"}
        </h2>
        <span style={{ fontSize: 13, color: "#888" }}>
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="ms-discover-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="ms-discover-card">
              <div className="ms-skeleton" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px" }} />
              <div className="ms-skeleton" style={{ width: 100, height: 14, margin: "0 auto 4px" }} />
              <div className="ms-skeleton" style={{ width: 80, height: 12, margin: "0 auto" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">🔍</div>
          <div className="ms-empty-title">
            {query ? "No matches found" : "No users yet"}
          </div>
          <div className="ms-empty-text">
            {query ? "Try a different search term" : "Be the first to create a profile!"}
          </div>
        </div>
      ) : (
        <div className="ms-discover-grid">
          {filtered.map(p => (
            <Link key={p.wallet_address} href={`/profile/${p.wallet_address}`} style={{ textDecoration: "none" }}>
              <div className="ms-discover-card">
                <img
                  src={p.avatar_url || DEFAULT_AVATAR}
                  alt={p.display_name || "User"}
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
                <span className="ms-name">
                  {p.display_name || `${p.wallet_address.slice(0, 8)}...`}
                </span>
                {p.bio && (
                  <span className="ms-bio">
                    {p.bio.slice(0, 60)}{p.bio.length > 60 ? "..." : ""}
                  </span>
                )}
                <span className="ms-bio" style={{ marginTop: 4 }}>
                  👁 {p.visitor_count} views
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
