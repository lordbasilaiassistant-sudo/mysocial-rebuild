"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_AVATAR, MOODS } from "@/lib/constants";

interface Profile {
  wallet_address: string;
  display_name: string;
  bio: string;
  interests: string;
  listening_to: string;
  audio_url: string;
  theme_color: string;
  avatar_url: string;
  banner_url: string;
  bg_image_url: string;
  visitor_count: number;
  created_at: string;
}

interface Friend {
  friend_address: string;
  position: number;
  display_name?: string;
  avatar_url?: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface WallComment {
  id: number;
  commenter_address: string;
  commenter_name?: string;
  commenter_avatar?: string;
  content: string;
  created_at: string;
}

export default function ProfilePage() {
  const { address: rawAddress } = useParams<{ address: string }>();
  const address = (rawAddress || "").toLowerCase();
  const { address: myAddress, token } = useAuth();
  const isOwner = myAddress?.toLowerCase() === address;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [wallComments, setWallComments] = useState<WallComment[]>([]);
  const [wallText, setWallText] = useState("");
  const [postingWall, setPostingWall] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    const viewer = myAddress || "";
    fetch(`/api/profile/${address}?viewer=${viewer}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile(data.profile);
          setFriends(data.friends || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch wall comments
    fetch(`/api/wall?address=${address}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setWallComments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [address, myAddress]);

  const handlePostWall = async () => {
    if (!wallText.trim() || !myAddress) return;
    setPostingWall(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/wall", {
        method: "POST",
        headers,
        body: JSON.stringify({
          commenter_address: myAddress,
          profile_address: address,
          content: wallText.trim(),
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setWallComments(prev => [{ ...comment, commenter_name: myAddress.slice(0, 8) }, ...prev]);
        setWallText("");
      }
    } catch (e) {
      console.error("Wall post error:", e);
    } finally {
      setPostingWall(false);
    }
  };

  if (loading) {
    return (
      <div>
        {/* Skeleton header */}
        <div className="ms-profile-header">
          <div className="ms-profile-banner" />
          <div className="ms-profile-info">
            <div className="ms-avatar ms-skeleton" />
            <div className="ms-profile-details">
              <div className="ms-skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
              <div className="ms-skeleton" style={{ width: 300, height: 14 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ms-empty">
        <div className="ms-empty-icon">👤</div>
        <div className="ms-empty-title">Profile not found</div>
        <div className="ms-empty-text">This user hasn&apos;t created a profile yet.</div>
        <Link href="/discover" className="ms-btn" style={{ marginTop: 12, display: "inline-flex" }}>
          Discover People
        </Link>
      </div>
    );
  }

  const displayName = profile.display_name || `${address.slice(0, 8)}...`;

  return (
    <div style={profile.bg_image_url ? { backgroundImage: `url(${profile.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", minHeight: "100vh", margin: "-16px", padding: "16px" } : undefined}>
      {/* Profile Header */}
      <div className="ms-profile-header">
        <div
          className="ms-profile-banner"
          style={profile.banner_url
            ? { background: `url(${profile.banner_url}) center/cover no-repeat` }
            : profile.theme_color
              ? { background: `linear-gradient(135deg, ${profile.theme_color}, #003375)` }
              : undefined
          }
        />
        <div className="ms-profile-info">
          <img
            className="ms-avatar"
            src={profile.avatar_url || DEFAULT_AVATAR}
            alt={displayName}
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
          />
          <div className="ms-profile-details">
            <div className="ms-profile-name">
              {displayName}
            </div>
            <div className="ms-profile-headline" style={{ color: "#888" }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className="ms-profile-stats">
              <div className="ms-profile-stat">
                <b>{friends.length}</b> <span>friends</span>
              </div>
              <div className="ms-profile-stat">
                <b>{profile.visitor_count}</b> <span>views</span>
              </div>
              <div className="ms-profile-stat">
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {isOwner ? (
                <Link href="/edit" className="ms-btn ms-btn-blue">
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button className="ms-btn">Add Friend</button>
                  <button className="ms-btn ms-btn-ghost">Message</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content: 2-column */}
      <div className="ms-profile-layout">
        {/* Left sidebar */}
        <div>
          {/* About */}
          {profile.bio && (
            <div className="ms-card">
              <div className="ms-card-header">About Me</div>
              <div className="ms-card-body" style={{ whiteSpace: "pre-wrap" }}>
                {profile.bio}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="ms-card">
            <div className="ms-card-header">Details</div>
            <div className="ms-card-body">
              <table className="ms-detail-table">
                <tbody>
                  {profile.interests && (
                    <tr>
                      <td className="ms-label">Interests</td>
                      <td className="ms-value">{profile.interests}</td>
                    </tr>
                  )}
                  {profile.listening_to && (
                    <tr>
                      <td className="ms-label">Listening</td>
                      <td className="ms-value">{profile.listening_to}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="ms-label">Network</td>
                    <td className="ms-value">Base (L2)</td>
                  </tr>
                  <tr>
                    <td className="ms-label">Wallet</td>
                    <td className="ms-value">
                      <a
                        href={`https://basescan.org/address/${address}`}
                        target="_blank"
                        rel="noopener"
                        style={{ fontSize: 12 }}
                      >
                        {address.slice(0, 10)}...{address.slice(-8)}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Visitor Counter */}
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div className="ms-counter">
              👁 {String(profile.visitor_count).padStart(6, "0")}
            </div>
          </div>
        </div>

        {/* Right main content */}
        <div>
          {/* Music Player */}
          {(profile.listening_to || profile.audio_url) && (
            <div className="ms-player">
              <div className="ms-player-info">
                <div className="ms-player-title">🎵 Now Playing</div>
                <div className="ms-player-artist">{profile.listening_to || "My Music"}</div>
              </div>
              {profile.audio_url && (
                <audio
                  controls
                  src={profile.audio_url}
                  style={{ width: "100%", height: 36, marginTop: 8 }}
                />
              )}
            </div>
          )}

          {/* Top 8 Friends */}
          <div className="ms-card">
            <div className="ms-card-header">
              <span>{displayName}&apos;s Friends ({friends.length})</span>
              {isOwner && <Link href="/edit">Edit</Link>}
            </div>
            <div className="ms-card-body">
              {friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: 12, color: "#888" }}>
                  {isOwner ? (
                    <>No friends yet. <Link href="/discover">Find people!</Link></>
                  ) : (
                    "No friends yet."
                  )}
                </div>
              ) : (
                <div className="ms-top8">
                  {friends.slice(0, 8).map(f => (
                    <div key={f.friend_address} className="ms-top8-cell">
                      <Link href={`/profile/${f.friend_address}`}>
                        <img
                          src={f.avatar_url || DEFAULT_AVATAR}
                          alt={f.display_name || ""}
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                        />
                      </Link>
                      <Link href={`/profile/${f.friend_address}`}>
                        {f.display_name || `${f.friend_address.slice(0, 6)}...`}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wall / Comments */}
          <div className="ms-card">
            <div className="ms-card-header">
              <span>{displayName}&apos;s Wall</span>
            </div>
            <div className="ms-card-body">
              {myAddress && (
                <div style={{ marginBottom: 12 }}>
                  <textarea
                    className="ms-textarea"
                    placeholder={isOwner ? "Write on your own wall..." : `Leave ${displayName} a comment...`}
                    value={wallText}
                    onChange={e => setWallText(e.target.value)}
                    rows={2}
                    maxLength={500}
                    style={{ minHeight: 50 }}
                  />
                  <div style={{ marginTop: 6, textAlign: "right" }}>
                    <button
                      className="ms-btn ms-btn-sm"
                      disabled={!wallText.trim() || postingWall}
                      onClick={handlePostWall}
                    >
                      {postingWall ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </div>
              )}
              {wallComments.length === 0 ? (
                <div style={{ textAlign: "center", padding: 16, color: "#888", fontSize: 13 }}>
                  No wall comments yet. {myAddress ? "Be the first!" : "Connect to leave a comment."}
                </div>
              ) : (
                wallComments.map(c => (
                  <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid #eef2f7" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <Link href={`/profile/${c.commenter_address}`}>
                        <img
                          src={c.commenter_avatar || DEFAULT_AVATAR}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                        />
                      </Link>
                      <Link href={`/profile/${c.commenter_address}`} style={{ fontWeight: 600, fontSize: 13, color: "#003375", textDecoration: "none" }}>
                        {c.commenter_name || `${c.commenter_address.slice(0, 8)}...`}
                      </Link>
                      <span style={{ fontSize: 11, color: "#888" }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, paddingLeft: 36 }}>
                      {c.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
