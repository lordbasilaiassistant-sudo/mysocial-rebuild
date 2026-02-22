"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_AVATAR } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface BlogPost {
  id: number;
  wallet_address: string;
  display_name?: string;
  avatar_url?: string;
  title: string;
  body: string;
  image_url?: string;
  is_tokenized: boolean;
  token_name: string;
  token_symbol: string;
  token_address: string;
  token_deploy_status: string;
  deploy_method?: string;
  view_count: number;
  created_at: string;
}

interface Author {
  wallet_address: string;
  display_name: string;
  avatar_url: string;
  bio: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function BlogPostClient({
  initialPost,
  author,
  postId,
}: {
  initialPost: BlogPost | null;
  author: Author | null;
  postId: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!initialPost) {
    return (
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Not Found" }]} />
        <div className="ms-empty">
          <div className="ms-empty-icon">📝</div>
          <div className="ms-empty-title">Post not found</div>
          <div className="ms-empty-text">This blog post doesn't exist or has been removed.</div>
          <Link href="/blog" className="ms-btn" style={{ marginTop: 12, display: "inline-flex" }}>
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const post = initialPost;
  const displayName = author?.display_name || post.display_name || `${post.wallet_address.slice(0, 8)}...`;
  const avatarUrl = author?.avatar_url || post.avatar_url || DEFAULT_AVATAR;
  const postUrl = `https://mysocial.mom/blog/${postId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareX = () => {
    const text = `${post.title} — by ${displayName} on MySocial`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title.length > 40 ? post.title.slice(0, 40) + "..." : post.title },
        ]}
      />

      <div className="ms-card" style={{ marginTop: 12 }}>
        {/* Author header */}
        <div className="ms-card-body" style={{ borderBottom: "1px solid #eef2f7", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href={`/profile/${post.wallet_address}`}>
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
              />
            </Link>
            <div>
              <Link
                href={`/profile/${post.wallet_address}`}
                style={{ fontWeight: 700, fontSize: 15, color: "#003375", textDecoration: "none" }}
              >
                {displayName}
              </Link>
              <div style={{ fontSize: 12, color: "#888" }}>
                Posted {timeAgo(post.created_at)} · {post.view_count} views
              </div>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="ms-card-body">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#003375", marginBottom: 16 }}>
            {post.title}
          </h1>
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              style={{ width: "100%", maxHeight: 500, objectFit: "cover", borderRadius: 8, marginBottom: 16 }}
            />
          )}
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#333" }}>
            {post.body}
          </div>
        </div>

        {/* Token section */}
        {post.is_tokenized && (
          <div className="ms-card-body" style={{ borderTop: "1px solid #eef2f7" }}>
            <div className="ms-token-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🪙</span>
                <span style={{ fontWeight: 700, color: "#003375" }}>ON-CHAIN</span>
                {post.token_symbol && (
                  <span style={{ fontWeight: 600, color: "#ff6600" }}>
                    ${post.token_symbol}
                  </span>
                )}
              </div>
              {post.deploy_method && (
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                  Deployed via: {post.deploy_method === "thryx" ? "THRYX Coin Factory" : "Bankr"}
                </div>
              )}
              {post.token_address ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>
                    {post.token_address.slice(0, 10)}...{post.token_address.slice(-8)}
                  </span>
                  <a
                    href={`https://basescan.org/token/${post.token_address}`}
                    target="_blank"
                    rel="noopener"
                    className="ms-btn ms-btn-sm"
                  >
                    View on BaseScan
                  </a>
                  <a
                    href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${post.token_address}`}
                    target="_blank"
                    rel="noopener"
                    className="ms-btn ms-btn-sm ms-btn-ghost"
                  >
                    Trade
                  </a>
                </div>
              ) : post.token_deploy_status === "pending" ? (
                <div style={{ fontSize: 13, color: "#ff6600" }}>
                  ⏳ Token deployment in progress...
                </div>
              ) : post.token_deploy_status === "failed" ? (
                <div style={{ fontSize: 13, color: "#cc0000" }}>
                  ❌ Token deployment failed
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="ms-card-body" style={{ borderTop: "1px solid #eef2f7", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#888", marginRight: 4 }}>Share:</span>
          <button className="ms-btn ms-btn-sm ms-btn-ghost" onClick={handleCopyLink}>
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <button className="ms-btn ms-btn-sm ms-btn-ghost" onClick={handleShareX}>
            Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
