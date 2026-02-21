import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyToken } from "@/lib/thryx-auth";

export const runtime = "nodejs";

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

  // Fallback: use address query param
  if (!address) {
    const addr = req.nextUrl.searchParams.get("address");
    if (!addr) return NextResponse.json({ error: "No address provided" }, { status: 401 });
    address = addr;
  }

  const uploadType = req.nextUrl.searchParams.get("type") || "image";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  if (uploadType === "audio") {
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Only audio files allowed" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
  } else {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }
  }

  const ext = file.name.split(".").pop() || (uploadType === "audio" ? "mp3" : "jpg");
  const folder = uploadType === "audio" ? "music" : "avatars";
  const filename = `${folder}/${address.toLowerCase()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
