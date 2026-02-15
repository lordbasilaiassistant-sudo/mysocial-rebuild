import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { createBulletin, getBulletins } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const bulletins = await getBulletins();
  return NextResponse.json(bulletins);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(authHeader.slice(7));
  let address: string;
  
  if (session) {
    address = session.address;
  } else {
    const body = await req.clone().json();
    if (!body.wallet_address) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    address = body.wallet_address;
  }

  const body = await req.json();
  const content = (body.content || "").trim();
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "Content must be 1-500 chars" }, { status: 400 });
  }

  const bulletin = await createBulletin(address, content);
  logActivity(address, 'bulletin_posted', { preview: content.slice(0, 100) }, 'mysocial');
  return NextResponse.json(bulletin, { status: 201 });
}
