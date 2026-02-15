import { NextResponse } from "next/server";
import { getFeaturedProfiles, getBulletins } from "@/lib/db";

export async function GET() {
  const [profiles, bulletins] = await Promise.all([
    getFeaturedProfiles(6),
    getBulletins(5),
  ]);
  return NextResponse.json({ profiles, bulletins });
}
