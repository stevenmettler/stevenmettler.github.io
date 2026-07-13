import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getPublishedPosts();
  return Response.json(posts);
}
