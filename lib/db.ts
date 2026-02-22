import { sql } from "@vercel/postgres";

// ── Profiles ──
export interface Profile {
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
    INSERT INTO profiles (wallet_address, display_name, bio, interests, listening_to, audio_url, theme_color, avatar_url, banner_url, bg_image_url)
    VALUES (${addr}, ${data.display_name || ''}, ${data.bio || ''}, ${data.interests || ''}, ${data.listening_to || ''}, ${data.audio_url || ''}, ${data.theme_color || '#003375'}, ${data.avatar_url || ''}, ${data.banner_url || ''}, ${data.bg_image_url || ''})
    ON CONFLICT (wallet_address) DO UPDATE SET
      display_name = COALESCE(NULLIF(${data.display_name || ''}, ''), profiles.display_name),
      bio = ${data.bio ?? ''},
      interests = ${data.interests ?? ''},
      listening_to = ${data.listening_to ?? ''},
      audio_url = ${data.audio_url ?? ''},
      theme_color = COALESCE(NULLIF(${data.theme_color || ''}, ''), profiles.theme_color),
      avatar_url = COALESCE(NULLIF(${data.avatar_url || ''}, ''), profiles.avatar_url),
      banner_url = COALESCE(NULLIF(${data.banner_url || ''}, ''), profiles.banner_url),
      bg_image_url = COALESCE(NULLIF(${data.bg_image_url || ''}, ''), profiles.bg_image_url),
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

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const q = `%${query.toLowerCase()}%`;
  const { rows } = await sql`
    SELECT * FROM profiles
    WHERE LOWER(display_name) LIKE ${q} OR wallet_address LIKE ${q}
    ORDER BY visitor_count DESC LIMIT ${limit}
  `;
  return rows as Profile[];
}

// ── Bulletins ──
export interface Bulletin {
  id: number;
  wallet_address: string;
  content: string;
  image_url?: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
  theme_color?: string;
}

export async function createBulletin(address: string, content: string, imageUrl?: string): Promise<Bulletin> {
  const { rows } = await sql`
    INSERT INTO bulletins (wallet_address, content, image_url) VALUES (${address.toLowerCase()}, ${content}, ${imageUrl || ''}) RETURNING *
  `;
  return rows[0] as Bulletin;
}

export async function getBulletins(limit = 20, offset = 0): Promise<{ bulletins: Bulletin[]; total: number }> {
  const { rows } = await sql`
    SELECT b.*, p.display_name, p.avatar_url, p.theme_color, COUNT(*) OVER() AS total_count FROM bulletins b
    LEFT JOIN profiles p ON b.wallet_address = p.wallet_address
    ORDER BY b.created_at DESC LIMIT ${limit} OFFSET ${offset}
  `;
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { bulletins: rows.map(({ total_count, ...rest }) => rest) as Bulletin[], total };
}

// ── Blog Posts ──
export interface BlogPost {
  id: number;
  wallet_address: string;
  title: string;
  body: string;
  image_url?: string;
  is_tokenized: boolean;
  token_name: string;
  token_symbol: string;
  token_address: string;
  token_deploy_job_id: string;
  token_deploy_status: string;
  deploy_method: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  display_name?: string;
  avatar_url?: string;
}

export async function createBlogPost(address: string, data: {
  title: string; body: string; image_url?: string;
  is_tokenized?: boolean; token_name?: string; token_symbol?: string;
  token_deploy_job_id?: string; token_deploy_status?: string;
  deploy_method?: string;
}): Promise<BlogPost> {
  const addr = address.toLowerCase();
  const { rows } = await sql`
    INSERT INTO blog_posts (wallet_address, title, body, image_url, is_tokenized, token_name, token_symbol, token_deploy_job_id, token_deploy_status, deploy_method)
    VALUES (${addr}, ${data.title}, ${data.body}, ${data.image_url || ''},
      ${data.is_tokenized || false},
      ${data.token_name || ''}, ${data.token_symbol || ''},
      ${data.token_deploy_job_id || ''}, ${data.token_deploy_status || ''},
      ${data.deploy_method || 'bankr'})
    RETURNING *
  `;
  return rows[0] as BlogPost;
}

export async function getBlogPosts(limit = 10, offset = 0): Promise<{ posts: BlogPost[]; total: number }> {
  const { rows } = await sql`
    SELECT bp.*, p.display_name, p.avatar_url, COUNT(*) OVER() AS total_count FROM blog_posts bp
    LEFT JOIN profiles p ON bp.wallet_address = p.wallet_address
    ORDER BY bp.created_at DESC LIMIT ${limit} OFFSET ${offset}
  `;
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { posts: rows.map(({ total_count, ...rest }) => rest) as BlogPost[], total };
}

export async function getBlogPostsByUser(address: string, limit = 10, offset = 0): Promise<{ posts: BlogPost[]; total: number }> {
  const { rows } = await sql`
    SELECT bp.*, p.display_name, p.avatar_url, COUNT(*) OVER() AS total_count FROM blog_posts bp
    LEFT JOIN profiles p ON bp.wallet_address = p.wallet_address
    WHERE bp.wallet_address = ${address.toLowerCase()}
    ORDER BY bp.created_at DESC LIMIT ${limit} OFFSET ${offset}
  `;
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { posts: rows.map(({ total_count, ...rest }) => rest) as BlogPost[], total };
}

export async function getBlogPost(id: number): Promise<BlogPost | null> {
  const { rows } = await sql`
    SELECT bp.*, p.display_name, p.avatar_url FROM blog_posts bp
    LEFT JOIN profiles p ON bp.wallet_address = p.wallet_address
    WHERE bp.id = ${id}
  `;
  if (rows[0]) {
    await sql`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ${id}`;
  }
  return rows[0] as BlogPost || null;
}

export async function updateBlogPostToken(id: number, tokenAddress: string, status: string) {
  await sql`
    UPDATE blog_posts SET token_address = ${tokenAddress}, token_deploy_status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ── Friendships (Top 8) ──
export interface Friendship {
  wallet_address: string;
  friend_address: string;
  position: number;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

export async function getFriends(address: string): Promise<Friendship[]> {
  const { rows } = await sql`
    SELECT f.*, p.display_name, p.avatar_url FROM friendships f
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

// ── Wall Comments ──
export interface WallComment {
  id: number;
  profile_address: string;
  commenter_address: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

export async function getWallComments(address: string, limit = 50): Promise<WallComment[]> {
  const { rows } = await sql`
    SELECT wc.*, p.display_name, p.avatar_url FROM wall_comments wc
    LEFT JOIN profiles p ON wc.commenter_address = p.wallet_address
    WHERE wc.profile_address = ${address.toLowerCase()}
    ORDER BY wc.created_at DESC LIMIT ${limit}
  `;
  return rows as WallComment[];
}

export async function postWallComment(profileAddress: string, commenterAddress: string, content: string): Promise<WallComment> {
  const { rows } = await sql`
    INSERT INTO wall_comments (profile_address, commenter_address, content)
    VALUES (${profileAddress.toLowerCase()}, ${commenterAddress.toLowerCase()}, ${content})
    RETURNING *
  `;
  return rows[0] as WallComment;
}
