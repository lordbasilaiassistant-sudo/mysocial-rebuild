import { NextRequest, NextResponse } from "next/server";
import { getBlogPost, getProfile, updateBlogPostToken } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPost(parseInt(id));
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get author profile for the blog post page
  const authorProfile = await getProfile(post.wallet_address);

  return NextResponse.json({
    post,
    author: authorProfile ? {
      wallet_address: authorProfile.wallet_address,
      display_name: authorProfile.display_name,
      avatar_url: authorProfile.avatar_url,
      bio: authorProfile.bio,
    } : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (body.token_address) {
    await updateBlogPostToken(parseInt(id), body.token_address, body.token_deploy_status || "completed");
  }
  return NextResponse.json({ ok: true });
}
