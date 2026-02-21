import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { upsertProfile, setFriends } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Try to verify token, but also accept wallet-based auth
  const session = await verifyToken(authHeader.slice(7));
  let address: string;

  if (session) {
    address = session.wallet;
  } else {
    // Fallback: trust the wallet address from the request body
    const body = await req.clone().json();
    if (!body.wallet_address) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    address = body.wallet_address;
  }

  const body = await req.json();
  
  const profile = await upsertProfile(address, {
    display_name: body.display_name,
    bio: body.bio,
    interests: body.interests,
    listening_to: body.listening_to,
    audio_url: body.audio_url,
    theme_color: body.theme_color,
    avatar_url: body.avatar_url,
  });

  if (body.friends) {
    await setFriends(address, body.friends);
  }

  return NextResponse.json({ profile });
}
