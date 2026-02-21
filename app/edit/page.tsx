"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { DEFAULT_AVATAR, THRYX_API } from "@/lib/constants";

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
  const [audioUrl, setAudioUrl] = useState("");
  const [themeColor, setThemeColor] = useState("#003375");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [friends, setFriends] = useState<string[]>(Array(8).fill(""));

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Local preview URLs (instant, no network delay)
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [bgPreview, setBgPreview] = useState("");

  // Refs for latest state values (avoids stale closures in upload handlers)
  const formRef = useRef({
    displayName, bio, interests, listeningTo, audioUrl, themeColor,
    avatarUrl, bannerUrl, bgImageUrl, friends,
  });
  useEffect(() => {
    formRef.current = {
      displayName, bio, interests, listeningTo, audioUrl, themeColor,
      avatarUrl, bannerUrl, bgImageUrl, friends,
    };
  });

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
          setAudioUrl(p.audio_url || "");
          setThemeColor(p.theme_color || "#003375");
          setAvatarUrl(p.avatar_url || "");
          setBannerUrl(p.banner_url || "");
          setBgImageUrl(p.bg_image_url || "");
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

  // Save profile helper — reads latest state from ref to avoid stale closures
  const saveProfile = async (overrides: Record<string, any> = {}) => {
    if (!address) return;
    const f = formRef.current;
    try {
      const hdrs: Record<string, string> = { "Content-Type": "application/json" };
      if (token) hdrs["Authorization"] = `Bearer ${token}`;
      await fetch("/api/profile", {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({
          wallet_address: address,
          display_name: f.displayName,
          bio: f.bio,
          interests: f.interests,
          listening_to: f.listeningTo,
          audio_url: f.audioUrl,
          theme_color: f.themeColor,
          avatar_url: f.avatarUrl,
          banner_url: f.bannerUrl,
          bg_image_url: f.bgImageUrl,
          friends: f.friends
            .map((addr, i) => ({ address: addr.trim(), position: i + 1 }))
            .filter(f => f.address),
          ...overrides,
        }),
      });
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  // Generic image upload helper
  const uploadImage = async (
    file: File,
    type: string,
    setUrl: (url: string) => void,
    setPreview: (url: string) => void,
    setLoading: (v: boolean) => void,
    dbField: string,
  ) => {
    if (!address) { alert("Connect your wallet first"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Max 10MB"); return; }

    // Immediate local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const hdrs: Record<string, string> = {};
      if (token) hdrs["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${THRYX_API}/api/upload?address=${address}&type=${type}`, {
        method: "POST",
        headers: hdrs,
        body: form,
      });
      const data = await res.json();
      if (data.url) {
        const freshUrl = data.url + "?t=" + Date.now();
        setUrl(freshUrl);
        // Auto-save to DB
        await saveProfile({ [dbField]: freshUrl });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || "Upload failed");
        setPreview(""); // clear local preview on failure
      }
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || "unknown error"));
      setPreview("");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!address) return;
    setSaving(true);
    setSaved(false);
    await saveProfile();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
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

  // Resolved display URLs (local preview takes priority over remote URL)
  const showAvatar = avatarPreview || avatarUrl || DEFAULT_AVATAR;
  const showBanner = bannerPreview || bannerUrl;
  const showBg = bgPreview || bgImageUrl;

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
                  Profile Picture
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={showAvatar}
                    alt="Preview"
                    className="ms-avatar-md"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                  />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="ms-btn ms-btn-ghost ms-btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
                      {uploading ? "Uploading..." : "📷 Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, "avatar", setAvatarUrl, setAvatarPreview, setUploading, "avatar_url");
                        }}
                      />
                    </label>
                    <input
                      className="ms-input"
                      type="url"
                      value={avatarUrl}
                      onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(""); }}
                      placeholder="...or paste image URL"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Now Playing (song title)
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
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Profile Music
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label className="ms-btn ms-btn-ghost ms-btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
                    {uploadingAudio ? "Uploading..." : "🎵 Upload Audio File"}
                    <input
                      type="file"
                      accept="audio/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!address) { alert("Connect your wallet first"); return; }
                        if (file.size > 10 * 1024 * 1024) { alert("Max 10MB"); return; }
                        setUploadingAudio(true);
                        try {
                          const form = new FormData();
                          form.append("file", file);
                          const hdrs: Record<string, string> = {};
                          if (token) hdrs["Authorization"] = `Bearer ${token}`;
                          const res = await fetch(`${THRYX_API}/api/upload?address=${address}&type=audio`, {
                            method: "POST",
                            headers: hdrs,
                            body: form,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setAudioUrl(data.url);
                            await saveProfile({ audio_url: data.url });
                            setSaved(true);
                            setTimeout(() => setSaved(false), 3000);
                          } else {
                            alert(data.error || "Upload failed");
                          }
                        } catch (err: any) { alert("Upload failed: " + (err?.message || "unknown error")); }
                        finally { setUploadingAudio(false); }
                      }}
                    />
                  </label>
                  <input
                    className="ms-input"
                    type="url"
                    value={audioUrl}
                    onChange={e => setAudioUrl(e.target.value)}
                    placeholder="...or paste audio URL (mp3, wav, etc.)"
                    style={{ fontSize: 12 }}
                  />
                  {audioUrl && (
                    <audio controls src={audioUrl} style={{ width: "100%", height: 32, marginTop: 4 }} />
                  )}
                </div>
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
              {/* Theme Color */}
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
                      flex: 1, height: 40, borderRadius: 8,
                      background: `linear-gradient(135deg, ${themeColor}, #003375)`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Fallback gradient when no banner image is set.
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Banner Image
                </label>
                <div style={{
                  width: "100%", height: 100, borderRadius: 8, overflow: "hidden",
                  background: showBanner
                    ? `url(${showBanner}) center/cover`
                    : `linear-gradient(135deg, ${themeColor}, #003375)`,
                  border: "1px solid #d4dbe4", marginBottom: 8,
                }} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label className="ms-btn ms-btn-ghost ms-btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
                    {uploadingBanner ? "Uploading..." : "🖼️ Upload Banner"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, "banner", setBannerUrl, setBannerPreview, setUploadingBanner, "banner_url");
                      }}
                    />
                  </label>
                  <input
                    className="ms-input"
                    type="url"
                    value={bannerUrl}
                    onChange={e => { setBannerUrl(e.target.value); setBannerPreview(""); }}
                    placeholder="...or paste banner image URL"
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  {bannerUrl && (
                    <button className="ms-btn-icon" onClick={() => { setBannerUrl(""); setBannerPreview(""); }} title="Remove">✕</button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Recommended: 960×200px. Appears at the top of your profile.
                </div>
              </div>

              {/* Background Image Upload */}
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4, color: "#333" }}>
                  Profile Background Image
                </label>
                <div style={{
                  width: "100%", height: 80, borderRadius: 8, overflow: "hidden",
                  background: showBg
                    ? `url(${showBg}) center/cover`
                    : "#f0f4fa",
                  border: "1px solid #d4dbe4", marginBottom: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#888", fontSize: 12,
                }}>
                  {!showBg && "No background set"}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label className="ms-btn ms-btn-ghost ms-btn-sm" style={{ cursor: "pointer", textAlign: "center" }}>
                    {uploadingBg ? "Uploading..." : "🎨 Upload Background"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(file, "background", setBgImageUrl, setBgPreview, setUploadingBg, "bg_image_url");
                      }}
                    />
                  </label>
                  <input
                    className="ms-input"
                    type="url"
                    value={bgImageUrl}
                    onChange={e => { setBgImageUrl(e.target.value); setBgPreview(""); }}
                    placeholder="...or paste background image URL"
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  {bgImageUrl && (
                    <button className="ms-btn-icon" onClick={() => { setBgImageUrl(""); setBgPreview(""); }} title="Remove">✕</button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Tiled behind your entire profile page. Classic MySpace vibes.
                </div>
              </div>

              {/* Preview */}
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8, color: "#333" }}>
                  Preview
                </label>
                <div style={{
                  border: "1px solid #d4dbe4", borderRadius: 10, overflow: "hidden",
                  background: showBg ? `url(${showBg}) center/cover` : "#fff",
                }}>
                  <div style={{
                    height: 60,
                    background: showBanner
                      ? `url(${showBanner}) center/cover`
                      : `linear-gradient(135deg, ${themeColor}, #003375)`,
                  }} />
                  <div style={{ padding: 12, display: "flex", gap: 10, marginTop: -20 }}>
                    <img
                      src={showAvatar}
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
