"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { DEFAULT_AVATAR } from "@/lib/constants";

const TABS = ["Basic", "About", "Appearance", "Top 8"] as const;
type Tab = typeof TABS[number];

export default function EditProfilePage() {
  const { address, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Basic");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [listeningTo, setListeningTo] = useState("");
  const [themeColor, setThemeColor] = useState("#003375");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [friends, setFriends] = useState<string[]>(Array(8).fill(""));

  // Load existing profile
  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile/${address}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile) {
          const p = data.profile;
          setDisplayName(p.display_name || "");
          setBio(p.bio || "");
          setInterests(p.interests || "");
          setListeningTo(p.listening_to || "");
          setThemeColor(p.theme_color || "#003375");
          setAvatarUrl(p.avatar_url || "");
        }
        if (data?.friends) {
          const arr = Array(8).fill("");
          data.friends.forEach((f: any) => {
            if (f.position >= 1 && f.position <= 8) {
              arr[f.position - 1] = f.friend_address;
            }
          });
          setFriends(arr);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    setSaved(false);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wallet_address: address,
          display_name: displayName,
          bio,
          interests,
          listening_to: listeningTo,
          theme_color: themeColor,
          avatar_url: avatarUrl,
          friends: friends
            .map((addr, i) => ({ address: addr.trim(), position: i + 1 }))
            .filter(f => f.address),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (!address) {
    return (
      <div className="ms-empty">
        <div className="ms-empty-icon">🔒</div>
        <div className="ms-empty-title">Connect your wallet</div>
        <div className="ms-empty-text">You need to connect your wallet to edit your profile.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ms-card">
        <div className="ms-card-body" style={{ padding: 40, textAlign: "center", color: "#888" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#003375" }}>Edit Profile</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span className="ms-alert-ok" style={{ margin: 0, padding: "4px 10px" }}>Saved!</span>}
          <button className="ms-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button className="ms-btn ms-btn-ghost" onClick={() => router.push(`/profile/${address}`)}>
            View Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ms-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`ms-tab ${activeTab === tab ? "ms-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="ms-card">
        <div className="ms-card-body" style={{ padding: 20 }}>

          {activeTab === "Basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Display Name
                </label>
                <input
                  className="ms-input"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Avatar URL
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img
                    src={avatarUrl || DEFAULT_AVATAR}
                    alt="Preview"
                    className="ms-avatar-md"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <input
                    className="ms-input"
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Currently Listening To
                </label>
                <input
                  className="ms-input"
                  type="text"
                  value={listeningTo}
                  onChange={e => setListeningTo(e.target.value)}
                  placeholder="Artist — Song Title"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {activeTab === "About" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Bio
                </label>
                <textarea
                  className="ms-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={5}
                  maxLength={2000}
                />
                <div style={{ fontSize: 11, color: "#888", marginTop: 2, textAlign: "right" }}>
                  {bio.length}/2000
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Interests
                </label>
                <textarea
                  className="ms-textarea"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  placeholder="Music, crypto, gaming, art..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {activeTab === "Appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Profile Theme Color
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    style={{ width: 40, height: 40, border: "none", cursor: "pointer", borderRadius: 6 }}
                  />
                  <input
                    className="ms-input"
                    type="text"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    style={{ width: 120 }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 8,
                      background: `linear-gradient(135deg, ${themeColor}, #003375)`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  This color appears as your profile banner gradient.
                </div>
              </div>

              {/* Preview */}
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#333" }}>
                  Preview
                </label>
                <div style={{
                  border: "1px solid #d4dbe4",
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: 60,
                    background: `linear-gradient(135deg, ${themeColor}, #003375)`,
                  }} />
                  <div style={{ padding: 12, display: "flex", gap: 10, marginTop: -20 }}>
                    <img
                      src={avatarUrl || DEFAULT_AVATAR}
                      alt="Preview"
                      style={{ width: 50, height: 50, borderRadius: "50%", border: "3px solid #fff", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                    <div style={{ paddingTop: 24 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{displayName || "Your Name"}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{address.slice(0, 6)}...{address.slice(-4)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Top 8" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                Add up to 8 friend wallet addresses. These appear on your profile.
              </div>
              {friends.map((addr, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#888", width: 20, textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <input
                    className="ms-input"
                    type="text"
                    value={addr}
                    onChange={e => {
                      const updated = [...friends];
                      updated[i] = e.target.value;
                      setFriends(updated);
                    }}
                    placeholder="0x..."
                    style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}
                  />
                  {addr && (
                    <button
                      className="ms-btn-icon"
                      onClick={() => {
                        const updated = [...friends];
                        updated[i] = "";
                        setFriends(updated);
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
