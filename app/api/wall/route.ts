import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { getWallComments, postWallComment } from "@/lib/db";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  const comments = await getWallComments(address);
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(authHeader.slice(7));
  let commenter: string;
  if (session) {
    commenter = session.wallet;
  } else {
    const body = await req.clone().json();
    if (!body.commenter_address) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    commenter = body.commenter_address;
  }

  const body = await req.json();
  if (!body.profile_address || !body.content?.trim()) {
    return NextResponse.json({ error: "profile_address and content required" }, { status: 400 });
  }

  const comment = await postWallComment(body.profile_address, commenter, body.content.trim());
  return NextResponse.json(comment, { status: 201 });
}
