import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyToken } from "@/lib/thryx-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(authHeader.slice(7));
  let address: string;
  if (session) {
    address = session.wallet;
  } else {
    // Fallback: check query param
    const addr = req.nextUrl.searchParams.get("address");
    if (!addr) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    address = addr;
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `avatars/${address.toLowerCase()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
