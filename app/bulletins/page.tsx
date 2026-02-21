"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_AVATAR } from "@/lib/constants";

interface Bulletin {
  id: number;
  wallet_address: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
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

export default function BulletinsPage() {
  const { address, token } = useAuth();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [myAvatar, setMyAvatar] = useState("");

  useEffect(() => {
    fetch("/api/bulletins")
      .then(r => r.ok ? r.json() : [])
      .then(data => setBulletins(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load user's avatar for compose box
  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile/${address}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile?.avatar_url) setMyAvatar(data.profile.avatar_url);
      })
      .catch(() => {});
  }, [address]);

  const handlePost = async () => {
    if (!postText.trim() || !address) return;
    setPosting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/bulletins", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: address,
          content: postText.trim(),
        }),
      });
      if (res.ok) {
        const bulletin = await res.json();
        setBulletins(prev => [{
          ...bulletin,
          display_name: address.slice(0, 8),
        }, ...prev]);
        setPostText("");
      }
    } catch (e) {
      console.error("Post error:", e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#003375", marginBottom: 12 }}>
        Bulletins
      </h1>

      {/* Compose */}
      {address ? (
        <div className="ms-compose">
          <div className="ms-compose-inner">
            <Link href={`/profile/${address}`}>
              <img className="ms-compose-avatar" src={myAvatar || DEFAULT_AVATAR} alt="" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
            </Link>
            <div className="ms-compose-fields">
              <textarea
                placeholder="Post a bulletin..."
                value={postText}
                onChange={e => setPostText(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className="ms-compose-actions">
                <span style={{ fontSize: 12, color: "#888" }}>
                  {postText.length}/500
                </span>
                <button
                  className="ms-btn"
                  disabled={!postText.trim() || posting}
                  onClick={handlePost}
                >
                  {posting ? "Posting..." : "Post Bulletin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ms-alert-info">
          Connect your wallet to post bulletins.
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} className="ms-post">
              <div className="ms-post-header">
                <div className="ms-skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <div>
                  <div className="ms-skeleton" style={{ width: 120, height: 14, marginBottom: 4 }} />
                  <div className="ms-skeleton" style={{ width: 60, height: 12 }} />
                </div>
              </div>
              <div className="ms-skeleton" style={{ width: "100%", height: 40 }} />
            </div>
          ))}
        </div>
      ) : bulletins.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">📢</div>
          <div className="ms-empty-title">No bulletins yet</div>
          <div className="ms-empty-text">Be the first to post a bulletin!</div>
        </div>
      ) : (
        bulletins.map(b => (
          <div key={b.id} className="ms-post">
            <div className="ms-post-header">
              <Link href={`/profile/${b.wallet_address}`}>
                <img
                  className="ms-post-avatar"
                  src={b.avatar_url || DEFAULT_AVATAR}
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
              </Link>
              <div className="ms-post-meta">
                <Link href={`/profile/${b.wallet_address}`} className="ms-post-author">
                  {b.display_name || `${b.wallet_address.slice(0, 8)}...`}
                </Link>
                <span className="ms-post-handle">
                  {b.wallet_address.slice(0, 6)}...{b.wallet_address.slice(-4)}
                </span>
                <div className="ms-post-time">{timeAgo(b.created_at)}</div>
              </div>
            </div>
            <div className="ms-post-body">
              {b.content}
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
  );
}
