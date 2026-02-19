"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface ProfileSubscription {
  pro: boolean;
  activeTiers: string[];
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function ProfilePage() {
  const params = useParams();
  const profileAddr = (params.address as string).toLowerCase();
  const { address } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileSub, setProfileSub] = useState<ProfileSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/profile/${profileAddr}?viewer=${address || ""}`);
        const data = await res.json();
        setProfile(data.profile);
        setFriends(data.friends || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profileAddr, address]);

  // Check if the profile user has a Pro subscription
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://thryx.mom/api/subscribe?wallet=${profileAddr}`);
        const data = await res.json();
        setProfileSub({ pro: data.pro || false, activeTiers: data.activeTiers || ['free'] });
      } catch {
        setProfileSub({ pro: false, activeTiers: ['free'] });
      }
    })();
  }, [profileAddr]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="skeleton h-[200px] rounded-2xl mb-6" />
        <div className="flex gap-4 mb-6">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="skeleton h-48" />
          <div className="skeleton h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  const color = profile?.theme_color || "#06b6d4";
  const isOwner = address === profileAddr;

  // Equalizer bars for music player
  const eqBars = Array.from({ length: 16 }, (_, i) => ({
    delay: `${(i * 0.1).toFixed(1)}s`,
    maxH: 6 + Math.floor(Math.random() * 18),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12">
      {/* ═══════ BANNER ═══════ */}
      <div
        className="profile-banner rounded-2xl relative"
        style={{ "--banner-color": color } as any}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ═══════ PROFILE HEADER ═══════ */}
      <div className="relative -mt-16 mb-8 px-4 md:px-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
        {/* Avatar */}
        <div
          className="avatar-ring animate-pulse-glow flex-shrink-0"
          style={{ "--accent": color, "--accent-alt": "#8b5cf6" } as any}
        >
          <div
            className="avatar-ring-inner w-28 h-28 text-4xl font-bold"
            style={{ color }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (profile?.display_name?.[0] || profileAddr[2] || "?").toUpperCase()
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-black text-white truncate">
              {profile?.display_name || shortAddr(profileAddr)}
            </h1>
            {profileSub?.pro && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold">
                ⚡ Pro
              </span>
            )}
            {profileSub?.activeTiers?.includes('ultimate') && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold">
                💎 Ultimate
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-white/20 mt-1 truncate">{profileAddr}</p>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="visitor-badge">
            <span className="text-white/30">visitor</span>
            <span className="counter-num">#{profile?.visitor_count || 0}</span>
          </div>
          {isOwner && (
            <Link href="/edit" className="btn-glass !py-2 !px-4 text-xs">
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* ═══════ STATS ROW ═══════ */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        <div className="stat-pill flex-1 min-w-[80px]">
          <span className="text-lg font-bold text-white">{profile?.visitor_count || 0}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Views</span>
        </div>
        <div className="stat-pill flex-1 min-w-[80px]">
          <span className="text-lg font-bold text-white">{friends.length}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Friends</span>
        </div>
        <div className="stat-pill flex-1 min-w-[80px]">
          <span className="text-lg font-bold text-white">
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : "—"}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Joined</span>
        </div>
        <a
          href={`https://basescan.org/address/${profileAddr}`}
          target="_blank"
          rel="noopener"
          className="stat-pill flex-1 min-w-[80px] hover:bg-white/5 transition group cursor-pointer"
        >
          <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition">↗</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">BaseScan</span>
        </a>
      </div>

      {/* ═══════ LISTENING TO (prominent) ═══════ */}
      {profile?.listening_to && (
        <div className="music-player-bar p-5 mb-8 flex items-center gap-4">
          <div className="flex items-end gap-[3px] h-6 flex-shrink-0">
            {eqBars.slice(0, 5).map((bar, i) => (
              <div
                key={i}
                className="eq-bar"
                style={{
                  animationDelay: bar.delay,
                  animationDuration: `${0.6 + Math.random() * 0.8}s`,
                  maxHeight: `${bar.maxH}px`,
                }}
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Now Playing</div>
            <div className="text-white font-medium truncate">{profile.listening_to}</div>
          </div>
          <div className="flex items-end gap-[3px] h-6 flex-shrink-0 opacity-40">
            {eqBars.slice(5, 10).map((bar, i) => (
              <div
                key={i}
                className="eq-bar"
                style={{
                  animationDelay: bar.delay,
                  animationDuration: `${0.6 + Math.random() * 0.8}s`,
                  maxHeight: `${bar.maxH}px`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════ TWO-COLUMN LAYOUT ═══════ */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="glass-card-static p-5">
            <h3 className="section-label mb-3" style={{ color }}>About Me</h3>
            <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
              {profile?.bio || "This user hasn't written anything yet…"}
            </p>
          </div>

          {/* Interests */}
          <div className="glass-card-static p-5">
            <h3 className="section-label mb-3" style={{ color }}>Interests</h3>
            {profile?.interests ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.split(",").map((interest: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/5"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/20">No interests listed</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-2 space-y-6">
          {/* Top 8 Friends */}
          <div className="glass-card-static p-5">
            <h3 className="section-label mb-4" style={{ color }}>
              {profile?.display_name ? `${profile.display_name}'s` : "My"} Top 8
            </h3>
            {friends.length > 0 ? (
              <div className="top8-grid">
                {friends.map((f: any) => (
                  <Link
                    key={f.friend_address}
                    href={`/profile/${f.friend_address}`}
                    className="text-center p-3 rounded-xl hover:bg-white/5 transition group"
                  >
                    <div className="avatar-ring mx-auto mb-2" style={{ "--accent": color, "--accent-alt": "#8b5cf6" } as any}>
                      <div className="avatar-ring-inner w-14 h-14 text-sm font-bold" style={{ color }}>
                        {(f.display_name?.[0] || f.friend_address[2] || "?").toUpperCase()}
                      </div>
                    </div>
                    <div className="text-xs text-white/40 group-hover:text-white transition truncate">
                      {f.display_name || shortAddr(f.friend_address)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/20 text-center py-8">
                No friends added yet
                {isOwner && (
                  <>
                    <br />
                    <Link href="/edit" className="text-sm hover:underline mt-2 inline-block" style={{ color }}>
                      Add some →
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Wall */}
          <div className="glass-card-static p-5">
            <h3 className="section-label mb-4" style={{ color }}>Wall</h3>
            <p className="text-sm text-white/20 text-center py-8">
              Wall posts coming soon… check the{" "}
              <Link href="/bulletins" className="hover:underline transition" style={{ color }}>
                Bulletin Board
              </Link>{" "}
              for now
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
