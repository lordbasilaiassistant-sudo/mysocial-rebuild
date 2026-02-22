import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/thryx-auth";
import { createBlogPost, getBlogPosts } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "10"), 50);
    const offset = (Math.max(page, 1) - 1) * limit;

    const { posts, total } = await getBlogPosts(limit, offset);
    return NextResponse.json({ posts, total, page, limit });
  } catch (e: any) {
    return NextResponse.json({ posts: [], total: 0, page: 1, limit: 10 }, { status: 200 });
  }
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
    if (!body.wallet_address) return NextResponse.json({ error: "No address provided" }, { status: 401 });
    address = body.wallet_address;
  }
  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  const post = await createBlogPost(address!, {
    title: body.title.trim(),
    body: body.body.trim(),
    image_url: body.image_url || "",
    is_tokenized: body.is_tokenized || false,
    token_name: body.token_name || "",
    token_symbol: body.token_symbol || "",
    token_deploy_job_id: body.token_deploy_job_id || "",
    token_deploy_status: body.token_deploy_status || "",
    deploy_method: body.deploy_method || "bankr",
  });

  return NextResponse.json(post, { status: 201 });
}
