import { sql } from "@vercel/postgres";

// ── Profiles ──
export interface Profile {
  wallet_address: string;
  display_name: string;
  bio: string;
  interests: string;
  listening_to: string;
  theme_color: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  visitor_count: number;
}

export async function getProfile(address: string): Promise<Profile | null> {
  const { rows } = await sql`
    SELECT * FROM profiles WHERE wallet_address = ${address.toLowerCase()}
  `;
  return rows[0] as Profile || null;
}

export async function upsertProfile(address: string, data: Partial<Profile>): Promise<Profile> {
  const addr = address.toLowerCase();
  const { rows } = await sql`
    INSERT INTO profiles (wallet_address, display_name, bio, interests, listening_to, theme_color, avatar_url)
    VALUES (${addr}, ${data.display_name || ''}, ${data.bio || ''}, ${data.interests || ''}, ${data.listening_to || ''}, ${data.theme_color || '#22d3ee'}, ${data.avatar_url || ''})
    ON CONFLICT (wallet_address) DO UPDATE SET
      display_name = COALESCE(NULLIF(${data.display_name || ''}, ''), profiles.display_name),
      bio = ${data.bio ?? ''},
      interests = ${data.interests ?? ''},
      listening_to = ${data.listening_to ?? ''},
      theme_color = COALESCE(NULLIF(${data.theme_color || ''}, ''), profiles.theme_color),
      avatar_url = COALESCE(NULLIF(${data.avatar_url || ''}, ''), profiles.avatar_url),
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as Profile;
}

export async function incrementVisitor(address: string): Promise<number> {
  const { rows } = await sql`
    UPDATE profiles SET visitor_count = visitor_count + 1 WHERE wallet_address = ${address.toLowerCase()} RETURNING visitor_count
  `;
  return rows[0]?.visitor_count || 0;
}

export async function getFeaturedProfiles(limit = 6): Promise<Profile[]> {
  const { rows } = await sql`
    SELECT * FROM profiles WHERE display_name != '' ORDER BY visitor_count DESC LIMIT ${limit}
  `;
  return rows as Profile[];
}

// ── Bulletins ──
export interface Bulletin {
  id: number;
  wallet_address: string;
  content: string;
  created_at: string;
  display_name?: string;
  theme_color?: string;
}

export async function createBulletin(address: string, content: string): Promise<Bulletin> {
  const { rows } = await sql`
    INSERT INTO bulletins (wallet_address, content) VALUES (${address.toLowerCase()}, ${content}) RETURNING *
  `;
  return rows[0] as Bulletin;
}

export async function getBulletins(limit = 50): Promise<Bulletin[]> {
  const { rows } = await sql`
    SELECT b.*, p.display_name, p.theme_color FROM bulletins b
    LEFT JOIN profiles p ON b.wallet_address = p.wallet_address
    ORDER BY b.created_at DESC LIMIT ${limit}
  `;
  return rows as Bulletin[];
}

// ── Friendships (Top 8) ──
export interface Friendship {
  wallet_address: string;
  friend_address: string;
  position: number;
  created_at: string;
  display_name?: string;
}

export async function getFriends(address: string): Promise<Friendship[]> {
  const { rows } = await sql`
    SELECT f.*, p.display_name FROM friendships f
    LEFT JOIN profiles p ON f.friend_address = p.wallet_address
    WHERE f.wallet_address = ${address.toLowerCase()}
    ORDER BY f.position ASC
  `;
  return rows as Friendship[];
}

export async function setFriends(address: string, friends: { address: string; position: number }[]) {
  const addr = address.toLowerCase();
  await sql`DELETE FROM friendships WHERE wallet_address = ${addr}`;
  for (const f of friends) {
    if (f.address && f.address.length > 0) {
      await sql`
        INSERT INTO friendships (wallet_address, friend_address, position)
        VALUES (${addr}, ${f.address.toLowerCase()}, ${f.position})
      `;
    }
  }
}
