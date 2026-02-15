"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const PRESET_COLORS = [
  "#06b6d4", "#8b5cf6", "#ec4899", "#f97316", "#22c55e",
  "#ef4444", "#3b82f6", "#eab308", "#14b8a6", "#f472b6",
];

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function EditPage() {
  const { address, token, connect } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [listeningTo, setListeningTo] = useState("");
  const [themeColor, setThemeColor] = useState("#06b6d4");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [friends, setFriends] = useState<string[]>(Array(8).fill(""));

  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile/${address}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        if (p) {
          setDisplayName(p.display_name || "");
          setBio(p.bio || "");
          setInterests(p.interests || "");
          setListeningTo(p.listening_to || "");
          setThemeColor(p.theme_color || "#06b6d4");
          setAvatarUrl(p.avatar_url || "");
        }
        if (data.friends?.length) {
          const f = Array(8).fill("");
          data.friends.forEach((fr: any) => {
            if (fr.position >= 1 && fr.position <= 8) f[fr.position - 1] = fr.friend_address;
          });
          setFriends(f);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [address]);

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 text-center py-24 space-y-6">
        <div className="text-5xl mb-2 opacity-20">✏️</div>
        <h1 className="text-3xl md:text-4xl font-black text-white">Edit Your Profile</h1>
        <p className="text-white/30 text-sm">Connect your wallet to get started</p>
        <button onClick={connect} className="btn-gradient">
          <span>Connect Wallet</span>
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet_address: address,
          display_name: displayName,
          bio,
          interests,
          listening_to: listeningTo,
          theme_color: themeColor,
          avatar_url: avatarUrl,
          friends: friends
            .map((addr, i) => ({ address: addr.trim().toLowerCase(), position: i + 1 }))
            .filter((f) => f.address),
        }),
      });
      router.push(`/profile/${address}`);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12">
      <div className="mb-8">
        <span className="section-label">Settings</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-2">Edit Profile</h1>
        <p className="text-xs font-mono text-white/20 mt-2">{address}</p>
      </div>

      {!loaded ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-5 gap-8">
          {/* FORM COLUMN */}
          <div className="md:col-span-3 space-y-6">
            {/* Display Name */}
            <div>
              <label className="section-label block mb-2">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="anon"
                maxLength={50}
                className="input-glass"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="section-label block mb-2">About Me</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself…"
                rows={4}
                maxLength={1000}
                className="input-glass resize-none"
              />
              <div className="text-right mt-1">
                <span className={`text-xs ${bio.length > 900 ? "text-red-400" : "text-white/15"}`}>
                  {bio.length}/1000
                </span>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="section-label block mb-2">Interests</label>
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="DeFi, NFTs, Base, Music, Memes"
                className="input-glass"
              />
              <p className="text-[10px] text-white/15 mt-1">Comma separated</p>
            </div>

            {/* Listening To */}
            <div>
              <label className="section-label block mb-2">🎵 Now Playing</label>
              <input
                value={listeningTo}
                onChange={(e) => setListeningTo(e.target.value)}
                placeholder="Artist — Song Title"
                className="input-glass"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="section-label block mb-2">Avatar URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="input-glass"
              />
              {avatarUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="avatar-ring" style={{ "--accent": themeColor, "--accent-alt": "#8b5cf6" } as any}>
                    <div className="avatar-ring-inner w-12 h-12 overflow-hidden">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-white/20">Preview</span>
                </div>
              )}
            </div>

            {/* Theme Color */}
            <div>
              <label className="section-label block mb-3">Theme Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setThemeColor(c)}
                    className={`w-9 h-9 rounded-full transition-all duration-200 ${
                      themeColor === c
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#030308] scale-110"
                        : "opacity-50 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <div className="relative">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-9 h-9 rounded-full cursor-pointer bg-transparent border-2 border-dashed border-white/10 opacity-50 hover:opacity-100 transition"
                  />
                </div>
              </div>
              <div className="mt-3 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${themeColor}, transparent)` }} />
            </div>

            {/* Top 8 Friends */}
            <div>
              <label className="section-label block mb-3">Top 8 Friends</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {friends.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${themeColor}20`, color: themeColor }}
                    >
                      {i + 1}
                    </span>
                    <input
                      value={f}
                      onChange={(e) => {
                        const n = [...friends];
                        n[i] = e.target.value;
                        setFriends(n);
                      }}
                      placeholder="0x..."
                      className="input-glass font-mono text-xs !py-2"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/15 mt-2">Paste wallet addresses of your top 8 friends</p>
            </div>

            {/* Save buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-gradient"
              >
                <span>{saving ? "Saving…" : "Save Profile"}</span>
              </button>
              <button
                onClick={() => router.push(`/profile/${address}`)}
                className="btn-glass"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* PREVIEW COLUMN */}
          <div className="md:col-span-2">
            <div className="sticky top-24">
              <span className="section-label block mb-3">Live Preview</span>
              <div className="glass-card-static overflow-hidden">
                {/* Mini banner */}
                <div
                  className="h-20 relative"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}40, ${themeColor}10, #030308)`,
                  }}
                />
                <div className="p-5 -mt-8">
                  {/* Avatar */}
                  <div className="avatar-ring mb-3" style={{ "--accent": themeColor, "--accent-alt": "#8b5cf6" } as any}>
                    <div className="avatar-ring-inner w-16 h-16 text-lg font-bold" style={{ color: themeColor }}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextSibling && ((e.target as HTMLImageElement).parentElement!.textContent = displayName?.[0]?.toUpperCase() || "?");
                          }}
                        />
                      ) : (
                        displayName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg">{displayName || "anon"}</h3>
                  <p className="text-xs font-mono text-white/20 mt-0.5">{shortAddr(address)}</p>

                  {listeningTo && (
                    <div className="mt-3 flex items-center gap-2 text-xs bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                      <span className="animate-rainbow">♫</span>
                      <span className="text-white/50 truncate">{listeningTo}</span>
                    </div>
                  )}

                  {bio && (
                    <div className="mt-3">
                      <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">About</div>
                      <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{bio}</p>
                    </div>
                  )}

                  {interests && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {interests.split(",").slice(0, 5).map((interest, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30"
                        >
                          {interest.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
