import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        wallet_address TEXT PRIMARY KEY,
        display_name TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        interests TEXT DEFAULT '',
        listening_to TEXT DEFAULT '',
        theme_color TEXT DEFAULT '#003375',
        avatar_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        visitor_count INTEGER DEFAULT 0
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bulletins (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS friendships (
        wallet_address TEXT NOT NULL,
        friend_address TEXT NOT NULL,
        position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 8),
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (wallet_address, friend_address)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_tokenized BOOLEAN DEFAULT false,
        token_name TEXT DEFAULT '',
        token_symbol TEXT DEFAULT '',
        token_address TEXT DEFAULT '',
        token_deploy_job_id TEXT DEFAULT '',
        token_deploy_status TEXT DEFAULT '',
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add missing columns to profiles
    try {
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT ''`;
    } catch { /* already exists */ }
    try {
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT ''`;
    } catch { /* already exists */ }
    try {
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bg_image_url TEXT DEFAULT ''`;
    } catch { /* already exists */ }

    await sql`
      CREATE TABLE IF NOT EXISTS wall_comments (
        id SERIAL PRIMARY KEY,
        profile_address TEXT NOT NULL,
        commenter_address TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add deploy_method column to blog_posts
    try {
      await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS deploy_method VARCHAR(20) DEFAULT 'bankr'`;
    } catch { /* already exists */ }

    return NextResponse.json({ ok: true, message: "All tables created/verified" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
