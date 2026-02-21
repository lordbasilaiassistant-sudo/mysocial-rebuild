import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { upsertProfile, setFriends } from "@/lib/db";

export async function POST(req: NextRequest) {
  let address: string | null = null;

  // Try Bearer token auth first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const session = await verifyToken(authHeader.slice(7));
    if (session) {
      address = session.wallet;
    }
  }

  const body = await req.json();

  // Fallback: use wallet_address from body
  if (!address) {
    if (!body.wallet_address) {
      return NextResponse.json({ error: "No address provided" }, { status: 401 });
    }
    address = body.wallet_address;
  }
  
  const profile = await upsertProfile(address!, {
    display_name: body.display_name,
    bio: body.bio,
    interests: body.interests,
    listening_to: body.listening_to,
    audio_url: body.audio_url,
    theme_color: body.theme_color,
    avatar_url: body.avatar_url,
    banner_url: body.banner_url,
    bg_image_url: body.bg_image_url,
  });

  if (body.friends) {
    await setFriends(address!, body.friends);
  }

  return NextResponse.json({ profile });
}
