import { Metadata } from "next";
import { getBlogPost, getProfile } from "@/lib/db";
import BlogPostClient from "./BlogPostClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getBlogPost(parseInt(id));

  if (!post) {
    return { title: "Post Not Found — MySocial" };
  }

  const description = post.body.slice(0, 160).replace(/\n/g, " ");
  const authorName = post.display_name || `${post.wallet_address.slice(0, 8)}...`;

  return {
    title: `${post.title} — ${authorName} on MySocial`,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `https://mysocial.mom/blog/${id}`,
      type: "article",
      siteName: "MySocial",
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getBlogPost(parseInt(id));

  let author = null;
  if (post) {
    const profile = await getProfile(post.wallet_address);
    if (profile) {
      author = {
        wallet_address: profile.wallet_address,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      };
    }
  }

  return <BlogPostClient initialPost={post} author={author} postId={id} />;
}
