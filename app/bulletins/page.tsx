"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

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

export default function BulletinsPage() {
  const { address, token, connect } = useAuth();
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBulletins = () => {
    fetch("/api/bulletins")
      .then((r) => r.json())
      .then(setBulletins)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBulletins();
  }, []);

  const handlePost = async () => {
    if (!token || !content.trim()) return;
    setPosting(true);
    try {
      await fetch("/api/bulletins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), wallet_address: address }),
      });
      setContent("");
      fetchBulletins();
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pb-12">
      {/* Header */}
      <div className="mb-8">
        <span className="section-label">Community</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-2">Bulletin Board</h1>
        <p className="text-sm text-white/25 mt-2">
          {bulletins.length} bulletin{bulletins.length !== 1 ? "s" : ""} posted
        </p>
      </div>

      {/* Post form */}
      {address ? (
        <div className="glass-card-static p-5 mb-8">
          <div className="flex items-start gap-3">
            <div
              className="avatar-ring flex-shrink-0 mt-0.5"
              style={{ "--accent": "#06b6d4", "--accent-alt": "#8b5cf6" } as any}
            >
              <div className="avatar-ring-inner w-10 h-10 text-xs font-bold text-cyan-400">
                {address[2]?.toUpperCase() || "?"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full bg-transparent text-white placeholder-white/20 resize-none outline-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className={`text-xs ${content.length > 450 ? "text-red-400" : "text-white/20"}`}>
                  {content.length}/500
                </span>
                <button
                  onClick={handlePost}
                  disabled={!content.trim() || posting}
                  className="btn-gradient text-sm !py-2 !px-6"
                >
                  <span>{posting ? "Posting…" : "Post"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gradient-border p-8 text-center mb-8">
          <p className="text-white/40 mb-4">Connect your wallet to post bulletins</p>
          <button onClick={connect} className="btn-gradient">
            <span>Connect Wallet</span>
          </button>
        </div>
      )}

      {/* Bulletin feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      ) : bulletins.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 opacity-20">📋</div>
          <p className="text-white/30 text-sm">No bulletins yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.map((b: any) => {
            const accent = b.theme_color || "#06b6d4";
            return (
              <div
                key={b.id}
                className="bulletin-card"
                style={{ "--accent-color": accent } as any}
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/profile/${b.wallet_address}`}
                    className="flex-shrink-0"
                  >
                    <div
                      className="avatar-ring"
                      style={{ "--accent": accent, "--accent-alt": "#8b5cf6" } as any}
                    >
                      <div
                        className="avatar-ring-inner w-10 h-10 text-xs font-bold"
                        style={{ color: accent }}
                      >
                        {(b.display_name?.[0] || b.wallet_address?.[2] || "?").toUpperCase()}
                      </div>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/profile/${b.wallet_address}`}
                        className="text-sm font-semibold hover:underline transition-colors truncate"
                        style={{ color: accent }}
                      >
                        {b.display_name || shortAddr(b.wallet_address)}
                      </Link>
                      <span className="text-white/10">·</span>
                      <span className="text-xs text-white/20 flex-shrink-0">{timeAgo(b.created_at)}</span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{b.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
