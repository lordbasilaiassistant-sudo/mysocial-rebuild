"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_AVATAR } from "@/lib/constants";
import { deployToken, pollDeployStatus, DeployMethod } from "@/lib/token-integration";
import Breadcrumbs from "@/components/Breadcrumbs";

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
  deploy_method?: string;
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tokenize, setTokenize] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [deployMethod, setDeployMethod] = useState<DeployMethod>("bankr");
  const [publishing, setPublishing] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  const fetchPosts = (p: number) => {
    setLoading(true);
    fetch(`/api/blog?page=${p}&limit=${limit}`)
      .then(r => r.ok ? r.json() : { posts: [], total: 0 })
      .then(data => {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const totalPages = Math.ceil(total / limit);

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !address) return;
    setPublishing(true);
    setDeployStatus("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let jobId = "";
      if (tokenize && tokenName && tokenSymbol) {
        if (deployMethod === "thryx") {
          setDeployStatus("THRYX Coin Factory is coming soon! Post will be saved without tokenization.");
        } else {
          setDeployStatus("Deploying token via Bankr...");
          const deployResult = await deployToken({
            name: tokenName,
            symbol: tokenSymbol,
            description: `${title} — Blog post on MySocial by ${address.slice(0, 8)}`,
            walletAddress: address,
            deployMethod: "bankr",
          });
          jobId = deployResult.jobId;
        }
      }

      const res = await fetch("/api/blog", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: address,
          title: title.trim(),
          body: body.trim(),
          is_tokenized: tokenize && deployMethod === "bankr",
          token_name: tokenName,
          token_symbol: tokenSymbol,
          token_deploy_job_id: jobId,
          token_deploy_status: jobId ? "pending" : "",
          deploy_method: deployMethod,
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
        setDeployMethod("bankr");
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
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
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

            {/* Tokenize toggle */}
            <div className="ms-tokenize-toggle">
              <input type="checkbox" id="tokenize" checked={tokenize} onChange={e => setTokenize(e.target.checked)} />
              <label htmlFor="tokenize">🪙 Make this post a coin (deploy as token on Base)</label>
            </div>

            {tokenize && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px", background: "#f8f9fb", border: "1px solid #e0e0e0", borderRadius: 4 }}>
                <div className="ms-tokenize-fields">
                  <input type="text" placeholder="Token Name" value={tokenName} onChange={e => setTokenName(e.target.value)} maxLength={30} />
                  <input type="text" placeholder="$SYMBOL" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value.toUpperCase())} maxLength={8} style={{ maxWidth: 120 }} />
                </div>

                {/* Deploy method picker */}
                <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Deploy via:</div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="deployMethod"
                    value="bankr"
                    checked={deployMethod === "bankr"}
                    onChange={() => setDeployMethod("bankr")}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Bankr (Clanker)</div>
                    <div style={{ color: "#888", fontSize: 12 }}>Deploys to Base via Clanker protocol. Standard Bankr fees apply.</div>
                  </div>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 13, opacity: 0.6 }}>
                  <input
                    type="radio"
                    name="deployMethod"
                    value="thryx"
                    checked={deployMethod === "thryx"}
                    onChange={() => setDeployMethod("thryx")}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Pair with $THRYX <span style={{ fontSize: 11, color: "#ff6600", fontWeight: 400 }}>(Coming Soon)</span></div>
                    <div style={{ color: "#888", fontSize: 12 }}>THRYX Coin Factory — creates token paired with $THRYX liquidity.</div>
                  </div>
                </label>
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

      {/* Posts */}
      {loading ? (
        <div>{[1, 2].map(i => <div key={i} className="ms-post"><div className="ms-skeleton" style={{ height: 80 }} /></div>)}</div>
      ) : posts.length === 0 ? (
        <div className="ms-empty">
          <div className="ms-empty-icon">✍️</div>
          <div className="ms-empty-title">No blog posts yet</div>
          <div className="ms-empty-text">{address ? "Write your first blog post!" : "Connect your wallet to start blogging."}</div>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="ms-post ms-post-clickable">
                <div className="ms-post-header">
                  <img className="ms-post-avatar" src={post.avatar_url || DEFAULT_AVATAR} alt=""
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }} />
                  <div className="ms-post-meta">
                    <span className="ms-post-author">
                      {post.display_name || `${post.wallet_address.slice(0, 8)}...`}
                    </span>
                    <span className="ms-post-time"> · {timeAgo(post.created_at)}</span>
                    {post.is_tokenized && (
                      <span className="ms-token-badge" style={{ marginLeft: 6 }}>
                        🪙 {post.token_symbol || "TOKEN"}
                      </span>
                    )}
                  </div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: "#003375" }}>{post.title}</h3>
                <div className="ms-post-body">
                  {post.body.slice(0, 300)}{post.body.length > 300 ? "..." : ""}
                </div>
                <div className="ms-post-actions" onClick={e => e.preventDefault()}>
                  <span style={{ fontSize: 12, color: "#888" }}>👁 {post.view_count} views</span>
                  {post.token_address && (
                    <a
                      href={`https://basescan.org/token/${post.token_address}`}
                      target="_blank"
                      rel="noopener"
                      className="ms-post-action"
                      style={{ color: "#003375" }}
                      onClick={e => e.stopPropagation()}
                    >
                      📊 View Token
                    </a>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ms-pagination">
              <button
                className="ms-btn ms-btn-sm"
                disabled={page <= 1}
                onClick={() => fetchPosts(page - 1)}
              >
                ← Newer
              </button>
              <span style={{ fontSize: 13, color: "#888" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="ms-btn ms-btn-sm"
                disabled={page >= totalPages}
                onClick={() => fetchPosts(page + 1)}
              >
                Older →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
