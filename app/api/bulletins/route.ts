import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { createBulletin, getBulletins } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const bulletins = await getBulletins();
  return NextResponse.json(bulletins);
}

export async function POST(req: NextRequest) {
  let address: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const session = await verifyToken(authHeader.slice(7));
    if (session) address = session.wallet;
  }

  const body = await req.json();

  if (!address) {
    if (!body.wallet_address) {
      return NextResponse.json({ error: "No address provided" }, { status: 401 });
    }
    address = body.wallet_address;
  }
  const content = (body.content || "").trim();
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "Content must be 1-500 chars" }, { status: 400 });
  }

  const bulletin = await createBulletin(address!, content);
  logActivity(address!, 'bulletin_posted', { preview: content.slice(0, 100) }, 'mysocial');
  return NextResponse.json(bulletin, { status: 201 });
}
