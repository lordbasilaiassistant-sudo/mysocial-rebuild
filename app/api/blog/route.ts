import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { createBlogPost, getBlogPosts } from "@/lib/db";

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json(posts);
  } catch (e: any) {
    return NextResponse.json([], { status: 200 });
  }
}

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
    const body = await req.clone().json();
    if (!body.wallet_address) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    address = body.wallet_address;
  }

  const body = await req.json();
  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const post = await createBlogPost(address, {
    title: body.title.trim(),
    body: body.body.trim(),
    is_tokenized: body.is_tokenized || false,
    token_name: body.token_name || "",
    token_symbol: body.token_symbol || "",
    token_deploy_job_id: body.token_deploy_job_id || "",
    token_deploy_status: body.token_deploy_status || "",
  });

  return NextResponse.json(post, { status: 201 });
}
