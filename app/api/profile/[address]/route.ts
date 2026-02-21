import { NextRequest, NextResponse } from "next/server";
import { getProfile, incrementVisitor, getFriends } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const profile = await getProfile(address);
  const friends = await getFriends(address);
  
  // Increment visitor count
  let visitorCount = profile?.visitor_count || 0;
  const viewer = req.nextUrl.searchParams.get("viewer");
  if (viewer && viewer.toLowerCase() !== address.toLowerCase()) {
    visitorCount = await incrementVisitor(address);
  }

  return NextResponse.json({
    profile: profile || { wallet_address: address.toLowerCase(), display_name: "", bio: "", interests: "", listening_to: "", audio_url: "", theme_color: "#003375", avatar_url: "", banner_url: "", bg_image_url: "", visitor_count: visitorCount, created_at: new Date().toISOString() },
    friends,
  });
}
