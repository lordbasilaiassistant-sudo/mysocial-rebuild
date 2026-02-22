"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_AVATAR } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Bulletin {
  id: number;
  wallet_address: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  image_url?: string;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [myAvatar, setMyAvatar] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const limit = 20;

  // Image upload state
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/bulletins?page=1&limit=${limit}`)
      .then(r => r.ok ? r.json() : { bulletins: [], total: 0 })
      .then(data => {
        setBulletins(data.bulletins || []);
        setTotal(data.total || 0);
        setPage(1);
      })
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

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetch(`/api/bulletins?page=${nextPage}&limit=${limit}`)
      .then(r => r.ok ? r.json() : { bulletins: [], total: 0 })
      .then(data => {
        setBulletins(prev => [...prev, ...(data.bulletins || [])]);
        setTotal(data.total || 0);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/upload?type=post&address=${address}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      } else {
        setImagePreview("");
      }
    } catch {
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

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
          image_url: imageUrl,
        }),
      });
      if (res.ok) {
        const bulletin = await res.json();
        setBulletins(prev => [{
          ...bulletin,
          display_name: address.slice(0, 8),
        }, ...prev]);
        setTotal(prev => prev + 1);
        setPostText("");
        setImageUrl("");
        setImagePreview("");
      }
    } catch (e) {
      console.error("Post error:", e);
    } finally {
      setPosting(false);
    }
  };

  const handleShare = (b: Bulletin) => {
    const text = `${b.content.slice(0, 100)}${b.content.length > 100 ? "..." : ""} — ${b.display_name || b.wallet_address.slice(0, 8)} on MySocial`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(b.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const hasMore = bulletins.length < total;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bulletins" }]} />

      <h1 style={{ fontSize: 20, fontWeight: 700, color: "#003375", marginBottom: 12, marginTop: 8 }}>
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
              {imagePreview && (
                <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                  <img src={imagePreview} alt="" style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, border: "1px solid #e0e0e0" }} />
                  <button
                    onClick={() => { setImageUrl(""); setImagePreview(""); }}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      border: "none", borderRadius: "50%", width: 24, height: 24,
                      cursor: "pointer", fontSize: 12, lineHeight: "24px", textAlign: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="ms-compose-actions">
                <div className="ms-compose-tools">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  <button
                    className="ms-post-action"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ fontSize: 13 }}
                  >
                    {uploading ? "..." : "📷"}
                  </button>
                </div>
                <span style={{ fontSize: 12, color: "#888" }}>
                  {postText.length}/500
                </span>
                <button
                  className="ms-btn"
                  disabled={!postText.trim() || posting || uploading}
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
        <>
          {bulletins.map(b => (
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
              {b.image_url && (
                <img
                  src={b.image_url}
                  alt=""
                  style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8, marginTop: 8 }}
                />
              )}
              <div className="ms-post-actions">
                <button className="ms-post-action ms-post-action-disabled" title="Coming soon">
                  💬 Reply
                </button>
                <button className="ms-post-action" onClick={() => handleShare(b)}>
                  {copiedId === b.id ? "✓ Copied!" : "🔗 Share"}
                </button>
                <button className="ms-post-action ms-post-action-disabled" title="Coming soon">
                  ❤️ Like
                </button>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <button
                className="ms-btn ms-btn-ghost"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More Bulletins"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
