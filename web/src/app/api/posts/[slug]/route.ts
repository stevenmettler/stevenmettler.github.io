import { getPublishedPostBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  return Response.json(post);
}
