import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { getPublishedPostBySlug, incrementPostViews } from "@/lib/posts";
import { getReactionsForPost } from "@/lib/reactions";
import { estimateReadingTime } from "@/lib/reading-time";
import { Reactions } from "./reactions";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) notFound();

  const reactionCounts = await getReactionsForPost(post.id);
  const readingMinutes = estimateReadingTime(post.bodyMarkdown);
  const views = await incrementPostViews(post.id);

  return (
    <div className="sm-site">
      <div className="sm-sheet">
        <nav className="sm-nav">
          <Link href="/">steven mettler</Link>
          <div className="sm-nav-links">
            <Link href="/#blog">&larr; back</Link>
          </div>
        </nav>

        <article className="sm-post">
          <h1 className="sm-post-title">{post.title}</h1>
          <p className="sm-post-date">
            {`${post.date.replaceAll("-", "·")} · ${readingMinutes} min read · ${views} views`}
          </p>
          <div className="sm-post-body">
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {post.bodyMarkdown}
            </ReactMarkdown>
          </div>
          <Reactions postId={post.id} initialCounts={reactionCounts} />
        </article>

        <footer className="sm-footer">
          <span>&copy; 2026 steven mettler</span>
          <span>set in fragment mono</span>
        </footer>
      </div>
    </div>
  );
}
