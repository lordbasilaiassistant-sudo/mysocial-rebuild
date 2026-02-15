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
        theme_color TEXT DEFAULT '#22d3ee',
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

    return NextResponse.json({ ok: true, message: "Tables created" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
