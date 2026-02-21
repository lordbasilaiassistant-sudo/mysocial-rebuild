import { NextResponse } from "next/server";
import { getFeaturedProfiles, getBulletins } from "@/lib/db";

export async function GET() {
  const [profiles, bulletinsResult] = await Promise.all([
    getFeaturedProfiles(6),
    getBulletins(5, 0),
  ]);
  return NextResponse.json({ profiles, bulletins: bulletinsResult.bulletins });
}
