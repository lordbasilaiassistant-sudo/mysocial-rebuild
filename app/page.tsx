"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_AVATAR } from "@/lib/constants";

interface FeaturedProfile {
  wallet_address: string;
  display_name: string;
  avatar_url: string;
  visitor_count: number;
}

interface Post {
  id: number;
  wallet_address: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  subject?: string;
  created_at: string;
  type: "bulletin" | "blog";
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

export default function HomePage() {
  const { address, pro, connect } = useAuth();
  const [profiles, setProfiles] = useState<FeaturedProfile[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [thryxPrice, setThryxPrice] = useState("");
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch("/api/featured")
      .then(r => r.ok ? r.json() : { profiles: [], bulletins: [] })
      .then(data => {
        setProfiles(data.profiles || []);
        const bulletins = (data.bulletins || []).map((b: any) => ({
          ...b,
          type: "bulletin" as const,
        }));
        setFeed(bulletins);
      })
      .catch(() => {});

    fetch("https://thryx.mom/api/price")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.price) setThryxPrice(`$${parseFloat(data.price).toFixed(8)}`);
      })
      .catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!postText.trim() || !address) return;
    setPosting(true);
    try {
      const res = await fetch("/api/bulletins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          content: postText.trim(),
        }),
      });
      if (res.ok) {
        const bulletin = await res.json();
        setFeed(prev => [{
          ...bulletin,
          display_name: address.slice(0, 8),
          type: "bulletin" as const,
        }, ...prev]);
        setPostText("");
      }
    } catch (e) {
      console.error("Post error:", e);
    } finally {
      setPosting(false);
    }
  };

  // ─── Not Connected: Welcome / Signup ───
  if (!address) {
    return (
      <div>
        {/* Hero */}
        <div className="ms-card" style={{ textAlign: "center" }}>
          <div className="ms-card-body" style={{ padding: "40px 24px" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#003375", marginBottom: 4 }}>
              My<span style={{ color: "#ff9933" }}>Social</span>
            </div>
            <div style={{ fontSize: 16, color: "#666", marginBottom: 20 }}>
              a place for friends — powered by $THRYX on Base
            </div>
            <p style={{ maxWidth: 500, margin: "0 auto 16px", color: "#444", fontSize: 15, lineHeight: 1.6 }}>
              Create your space. Share your thoughts. Find your people.
              No email, no password — just connect your wallet.
            </p>
            <button className="ms-btn ms-btn-lg" onClick={connect}>
              Connect Wallet to Join
            </button>
            {thryxPrice && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                $THRYX: <span style={{ color: "#006600", fontWeight: 600 }}>{thryxPrice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Discover People */}
        <div className="ms-card">
          <div className="ms-card-header-orange">
            People on MySocial
          </div>
          <div className="ms-card-body">
            <div className="ms-discover-grid">
              {profiles.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: "#888" }}>
                  Be the first to join!
                </div>
              ) : (
                profiles.slice(0, 8).map(p => (
                  <Link key={p.wallet_address} href={`/profile/${p.wallet_address}`} style={{ textDecoration: "none" }}>
                    <div className="ms-discover-card">
                      <img
                        src={p.avatar_url || DEFAULT_AVATAR}
                        alt={p.display_name || "User"}
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      />
                      <span className="ms-name">
                        {p.display_name || `${p.wallet_address.slice(0, 6)}...`}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {feed.length > 0 && (
          <div className="ms-card">
            <div className="ms-card-header">Recent Activity</div>
            <div className="ms-card-body" style={{ padding: 0 }}>
              {feed.slice(0, 5).map(post => (
                <div key={post.id} className="ms-post" style={{ border: "none", borderBottom: "1px solid #eef2f7", borderRadius: 0, margin: 0 }}>
                  <div className="ms-post-header">
                    <Link href={`/profile/${post.wallet_address}`}>
                      <img
                        className="ms-post-avatar"
                        src={post.avatar_url || DEFAULT_AVATAR}
                        alt=""
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      />
                    </Link>
                    <div className="ms-post-meta">
                      <Link href={`/profile/${post.wallet_address}`} className="ms-post-author">
                        {post.display_name || `${post.wallet_address.slice(0, 8)}...`}
                      </Link>
                      <span className="ms-post-handle">
                        {post.wallet_address.slice(0, 6)}...{post.wallet_address.slice(-4)}
                      </span>
                      <div className="ms-post-time">{timeAgo(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="ms-post-body">
                    {post.content.slice(0, 280)}{post.content.length > 280 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Connected: Feed View ───
  return (
    <div className="ms-layout">
      <div className="ms-main">
        {/* Compose */}
        <div className="ms-compose">
          <div className="ms-compose-inner">
            <Link href={`/profile/${address}`}>
              <img className="ms-compose-avatar" src={DEFAULT_AVATAR} alt="" />
            </Link>
            <div className="ms-compose-fields">
              <textarea
                placeholder="What's on your mind?"
                value={postText}
                onChange={e => setPostText(e.target.value)}
                rows={2}
              />
              <div className="ms-compose-actions">
                <div className="ms-compose-tools">
                  {/* Future: image, mood, tokenize */}
                </div>
                <button
                  className="ms-btn"
                  disabled={!postText.trim() || posting}
                  onClick={handlePost}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        {feed.length === 0 ? (
          <div className="ms-empty">
            <div className="ms-empty-icon">📝</div>
            <div className="ms-empty-title">No posts yet</div>
            <div className="ms-empty-text">Be the first to share something!</div>
          </div>
        ) : (
          feed.map(post => (
            <div key={post.id} className="ms-post">
              <div className="ms-post-header">
                <Link href={`/profile/${post.wallet_address}`}>
                  <img
                    className="ms-post-avatar"
                    src={post.avatar_url || DEFAULT_AVATAR}
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                </Link>
                <div className="ms-post-meta">
                  <Link href={`/profile/${post.wallet_address}`} className="ms-post-author">
                    {post.display_name || `${post.wallet_address.slice(0, 8)}...`}
                  </Link>
                  <span className="ms-post-handle">
                    {post.wallet_address.slice(0, 6)}...{post.wallet_address.slice(-4)}
                  </span>
                  <div className="ms-post-time">{timeAgo(post.created_at)}</div>
                </div>
              </div>
              <div className="ms-post-body">
                {post.content}
              </div>
              <div className="ms-post-actions">
                <button className="ms-post-action">💬 Reply</button>
                <button className="ms-post-action">🔄 Share</button>
                <button className="ms-post-action">❤️ Like</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar */}
      <div className="ms-sidebar">
        {/* Quick Actions */}
        <div className="ms-card">
          <div className="ms-card-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Link href={`/profile/${address}`} className="ms-btn ms-btn-blue" style={{ textAlign: "center" }}>
              My Profile
            </Link>
            <Link href="/edit" className="ms-btn ms-btn-ghost" style={{ textAlign: "center" }}>
              Edit Profile
            </Link>
            <Link href="/discover" className="ms-btn ms-btn-ghost" style={{ textAlign: "center" }}>
              Find People
            </Link>
          </div>
        </div>

        {/* $THRYX Info */}
        <div className="ms-card">
          <div className="ms-card-header">$THRYX</div>
          <div className="ms-card-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#003375", marginBottom: 6 }}>
              {thryxPrice || "Loading..."}
            </div>
            <a href="https://thryx.mom/swap" target="_blank" rel="noopener" className="ms-btn ms-btn-sm">
              Trade $THRYX
            </a>
          </div>
        </div>

        {/* People You Might Know */}
        {profiles.length > 0 && (
          <div className="ms-card">
            <div className="ms-card-header">
              <span>People</span>
              <Link href="/discover">See All</Link>
            </div>
            <div className="ms-card-body" style={{ padding: 8 }}>
              {profiles.slice(0, 4).map(p => (
                <Link
                  key={p.wallet_address}
                  href={`/profile/${p.wallet_address}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 6px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#f0f4fa")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  <img
                    src={p.avatar_url || DEFAULT_AVATAR}
                    alt=""
                    className="ms-avatar-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {p.display_name || `${p.wallet_address.slice(0, 8)}...`}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {p.wallet_address.slice(0, 6)}...{p.wallet_address.slice(-4)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ecosystem */}
        <div className="ms-card">
          <div className="ms-card-header">Ecosystem</div>
          <div className="ms-card-body" style={{ fontSize: 13, lineHeight: 2 }}>
            <a href="https://thryx.mom" target="_blank" rel="noopener">Hub</a>{" · "}
            <a href="https://mint.thryx.mom" target="_blank" rel="noopener">MemeMint</a>{" · "}
            <a href="https://scanner.thryx.mom" target="_blank" rel="noopener">Scanner</a>{" · "}
            <a href="https://signals.thryx.mom" target="_blank" rel="noopener">Signals</a>{" · "}
            <a href="https://portfolio.thryx.mom" target="_blank" rel="noopener">Portfolio</a>
          </div>
        </div>
      </div>
    </div>
  );
}
