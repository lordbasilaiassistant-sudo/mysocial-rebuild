"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { deployToken, pollDeployStatus } from "@/lib/token-integration";

interface BlogPost {
  id: number;
  wallet_address: string;
  display_name: string;
  avatar_url?: string;
  title: string;
  body: string;
  is_tokenized: boolean;
  token_name: string;
  token_symbol: string;
  token_address: string;
  token_deploy_status: string;
  view_count: number;
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
  return `${days}d`;
}

export default function BlogPage() {
  const { address, token } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tokenize, setTokenize] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  useEffect(() => {
    fetch("/api/blog")
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !address) return;
    setPublishing(true);
    setDeployStatus("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let jobId = "";
      if (tokenize && tokenName && tokenSymbol) {
        setDeployStatus("Deploying token...");
        const deployResult = await deployToken({
          name: tokenName,
          symbol: tokenSymbol,
          description: `${title} — Blog post on MySocial by ${address.slice(0, 8)}`,
          walletAddress: address,
        });
        jobId = deployResult.jobId;
      }

      const res = await fetch("/api/blog", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: address,
          title: title.trim(),
          body: body.trim(),
          is_tokenized: tokenize,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          token_deploy_job_id: jobId,
          token_deploy_status: jobId ? "pending" : "",
        }),
      });

      if (res.ok) {
        const post = await res.json();
        setPosts(prev => [{ ...post, display_name: address.slice(0, 8) }, ...prev]);

        if (jobId && post.id) {
          setDeployStatus("Token deploying...");
          pollDeployStatus(jobId, (status) => {
            setDeployStatus(`Token: ${status.status}`);
            if (status.tokenAddress) {
              fetch(`/api/blog/${post.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token_address: status.tokenAddress, token_deploy_status: "completed" }),
              });
              setDeployStatus(`Token deployed! ${status.tokenAddress.slice(0, 10)}...`);
            }
          });
        }

        setTitle("");
        setBody("");
        setTokenize(false);
        setTokenName("");
        setTokenSymbol("");
        setShowCompose(false);
      }
    } catch (e: any) {
      setDeployStatus(`Error: ${e.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#003375" }}>Blog</h1>
        {address && (
          <button className="ms-btn" onClick={() => setShowCompose(!showCompose)}>
            {showCompose ? "Cancel" : "Write New Post"}
          </button>
        )}
      </div>

      {deployStatus && <div className="ms-alert-info">{deployStatus}</div>}

      {showCompose && address && (
        <div className="ms-card" style={{ marginBottom: 16 }}>
          <div className="ms-card-header">New Blog Post</div>
          <div className="ms-card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              className="ms-input"
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (tokenize && !tokenName) setTokenName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, "").trim());
              }}
              maxLength={200}
            />
            <textarea
              className="ms-textarea"
              placeholder="Write your blog post..."
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
            />
            <div className="ms-tokenize-toggle">
              <input type="checkbox" id="tokenize" checked={tokenize} onChange={e => setTokenize(e.target.checked)} />
              <label htmlFor="tokenize">🪙 Make this post a coin (deploy as token on Base)</label>
            </div>
            {tokenize && (
              <div className="ms-tokenize-fields">
                <input type="text" placeholder="Token Name" value={tokenName} onChange={e => setTokenName(e.target.value)} maxLength={30} />
                <input type="text" placeholder="$SYMBOL" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value.toUpperCase())} maxLength={8} style={{ maxWidth: 120 }} />
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="ms-btn" disabled={!title.trim() || !body.trim() || publishing} onClick={handlePublish}>
                {publishing ? "Publishing..." : tokenize ? "Publish & Deploy Token" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div>{[1, 2].map(i => <div key={i} className="ms-post"><div className="ms-skeleton" style={{ height: 80 }} /></div>)}</div>
      ) : posts.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">✍️</div>
          <div className="ms-empty-title">No blog posts yet</div>
          <div className="ms-empty-text">{address ? "Write your first blog post!" : "Connect your wallet to start blogging."}</div>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="ms-post">
            <div className="ms-post-header">
              <Link href={`/profile/${post.wallet_address}`}>
                <img className="ms-post-avatar" src={post.avatar_url || DEFAULT_AVATAR} alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
              </Link>
              <div className="ms-post-meta">
                <Link href={`/profile/${post.wallet_address}`} className="ms-post-author">
                  {post.display_name || `${post.wallet_address.slice(0, 8)}...`}
                </Link>
                <span className="ms-post-time"> · {timeAgo(post.created_at)}</span>
                {post.is_tokenized && (
                  <span className="ms-token-badge" style={{ marginLeft: 6 }}>
                    🪙 {post.token_symbol || "TOKEN"}
                  </span>
                )}
              </div>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{post.title}</h3>
            <div className="ms-post-body">
              {post.body.slice(0, 400)}{post.body.length > 400 ? "..." : ""}
            </div>
            <div className="ms-post-actions">
              <span style={{ fontSize: 12, color: "#888" }}>👁 {post.view_count} views</span>
              <button className="ms-post-action">💬 Comment</button>
              <button className="ms-post-action">❤️ Like</button>
              {post.token_address && (
                <a
                  href={`https://basescan.org/token/${post.token_address}`}
                  target="_blank"
                  rel="noopener"
                  className="ms-post-action"
                  style={{ color: "#003375" }}
                >
                  📊 View Token
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
