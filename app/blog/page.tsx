"use client";

import { useEffect, useState, useRef } from "react";
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
  const [twitterHandle, setTwitterHandle] = useState("thryxagi");
  const [publishing, setPublishing] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  // Image upload state
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    // Show instant preview
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

  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !address) return;
    setPublishing(true);
    setDeployStatus("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Step 1: Create the blog post FIRST (so we have the ID for the website URL)
      const res = await fetch("/api/blog", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: address,
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl,
          is_tokenized: tokenize && deployMethod === "bankr",
          token_name: tokenName,
          token_symbol: tokenSymbol,
          token_deploy_status: tokenize && deployMethod === "bankr" ? "pending" : "",
          deploy_method: deployMethod,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");
      const post = await res.json();
      setPosts(prev => [{ ...post, display_name: address.slice(0, 8) }, ...prev]);

      // Step 2: Deploy token AFTER post is created (so we can use blog URL as website)
      if (tokenize && tokenName && tokenSymbol) {
        if (deployMethod === "thryx") {
          setDeployStatus("THRYX Coin Factory is coming soon! Post saved without tokenization.");
        } else {
          const blogUrl = `https://mysocial.mom/blog/${post.id}`;
          setDeployStatus("Deploying token via Bankr...");

          try {
            const deployResult = await deployToken({
              name: tokenName,
              symbol: tokenSymbol,
              description: `${title} — Blog post on MySocial by ${address.slice(0, 8)}`,
              walletAddress: address,
              imageUrl: imageUrl || undefined,
              website: blogUrl,
              twitter: twitterHandle.trim() || undefined,
              deployMethod: "bankr",
            });

            const jobId = deployResult.jobId;

            // Update the post with the job ID
            await fetch(`/api/blog/${post.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token_deploy_job_id: jobId, token_deploy_status: "pending" }),
            });

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
                // Update post in local state
                setPosts(prev => prev.map(p =>
                  p.id === post.id ? { ...p, token_address: status.tokenAddress!, token_deploy_status: "completed" } : p
                ));
              }
            });
          } catch (deployErr: any) {
            setDeployStatus(`Deploy error: ${deployErr.message}`);
          }
        }
      }

      // Reset form fields but keep compose open if deploying
      setTitle("");
      setBody("");
      setImageUrl("");
      setImagePreview("");
      if (!tokenize || deployMethod === "thryx") {
        setTokenize(false);
        setTokenName("");
        setTokenSymbol("");
        setDeployMethod("bankr");
        setTwitterHandle("thryxagi");
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

            {/* Image upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <button
                className="ms-btn ms-btn-sm ms-btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "📷 Add Image"}
              </button>
              {imagePreview && (
                <div style={{ marginTop: 8, position: "relative", display: "inline-block" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "1px solid #e0e0e0" }}
                  />
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
            </div>

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

                {/* Twitter handle for fee routing */}
                <div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                    X/Twitter handle for fee routing (receives trading fees via Bankr)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 14, color: "#888" }}>@</span>
                    <input
                      type="text"
                      placeholder="thryxagi"
                      value={twitterHandle}
                      onChange={e => setTwitterHandle(e.target.value.replace(/^@/, ""))}
                      maxLength={30}
                      style={{ flex: 1, padding: "6px 8px", border: "1px solid #e0e0e0", borderRadius: 4, fontSize: 13, fontFamily: "monospace" }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                    Default: @thryxagi — change to route fees to a different X account
                  </div>
                </div>

                {/* Deploy status inside token box */}
                {deployStatus && (
                  <div style={{ padding: "8px 12px", background: "#fff", border: "1px solid #c4d4e8", borderRadius: 6, fontSize: 13, color: "#003375" }}>
                    {deployStatus}
                  </div>
                )}

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
                    <div style={{ fontWeight: 600 }}>Bankr</div>
                    <div style={{ color: "#888", fontSize: 12 }}>Deploys to Base via Bankr. Standard fees apply, trading fees go to @{twitterHandle || "thryxagi"}.</div>
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
              <button className="ms-btn" disabled={!title.trim() || !body.trim() || publishing || uploading} onClick={handlePublish}>
                {publishing ? "Publishing..." : tokenize ? "Publish & Deploy Token" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy status banner (shown when compose is closed but deploy is still running) */}
      {!showCompose && deployStatus && (
        <div style={{
          padding: "10px 14px", marginBottom: 12, background: "#f0f4fa",
          border: "1px solid #c4d4e8", borderRadius: 8, fontSize: 13, color: "#003375",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          🪙 {deployStatus}
          <button
            className="ms-btn ms-btn-sm ms-btn-ghost"
            onClick={() => setDeployStatus("")}
            style={{ marginLeft: "auto", fontSize: 11 }}
          >
            Dismiss
          </button>
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
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                  />
                )}
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
