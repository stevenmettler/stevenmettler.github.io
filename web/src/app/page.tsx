import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { GitHubActivity } from "./github-activity";
import { SiteBackground } from "./site-background";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPublishedPosts();

  return (
    <div className="sm-site">
      <SiteBackground />
      <div className="sm-sheet">
        <nav className="sm-nav">
          <Link href="/">steven mettler</Link>
          <div className="sm-nav-links">
            <a href="#about">01 about</a>
            <a href="#work">02 work</a>
            <a href="#blog">03 blog</a>
            <a href="#games">04 games</a>
            <a href="#contact">05 contact</a>
            <a href="/feed.xml" className="sm-nav-resume">
              rss
            </a>
            <a href="/MettlerResume2025.pdf" className="sm-nav-resume">
              resume
            </a>
            <ThemeToggle />
          </div>
        </nav>

        <header className="sm-hero">
          <h1>Steven&nbsp;Mettler</h1>
          <p className="sm-subtitle">Senior&nbsp;Software&nbsp;Engineer</p>
          <p className="sm-quote">
            &ldquo;The reward of a work is to have produced it; the reward of
            effort is to have grown by it.&rdquo;&nbsp;&nbsp;&mdash;&nbsp;Antonin&nbsp;Sertillanges
          </p>
        </header>

        <section id="about" className="sm-section">
          <div className="sm-section-label">
            01
            <br />
            ABOUT
          </div>
          <div className="sm-section-content">
            Building at Capital One. Pursuing a Master&rsquo;s in CS at
            Georgia&nbsp;Tech. Penn&nbsp;State alum.
          </div>
        </section>

        <section id="work" className="sm-section">
          <div className="sm-section-label">
            02
            <br />
            WORK
          </div>
          <div className="sm-section-content">
            <div className="sm-work-row">
              <span>
                SWE&nbsp;@&nbsp;Capital&nbsp;One &mdash; crafting scalable
                things
              </span>
              <span className="sm-work-years">2022&mdash;</span>
            </div>
            <div className="sm-work-code">
              code: <a href="https://github.com/stevenmettler">github</a>
            </div>
            <GitHubActivity />
          </div>
        </section>

        <section id="blog" className="sm-section">
          <div className="sm-section-label">
            03
            <br />
            BLOG
          </div>
          <div className="sm-blog-content">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-row">
                <span className="blog-row-title">{post.title}</span>
                <span className="blog-row-date">
                  {post.date.replaceAll("-", "·")}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="games" className="sm-section">
          <div className="sm-section-label">
            04
            <br />
            GAMES
          </div>
          <div className="sm-section-content sm-games-content">
            <Link href="/games/skullbreaker">skullbreaker</Link> &mdash; a
            small game about breaking skulls
            <br />
            <Link href="/games/catacombs">catacombs</Link> &mdash; a tiny
            roguelike dungeon crawl
          </div>
        </section>

        <section id="contact" className="sm-section">
          <div className="sm-section-label sm-contact-label">
            05
            <br />
            CONTACT
          </div>
          <div className="sm-section-content sm-contact-content">
            <a
              href="mailto:steven.e.mettler@gmail.com"
              className="sm-contact-email"
            >
              steven.e.mettler@gmail.com
            </a>
            <a href="/MettlerResume2025.pdf" className="sm-contact-resume">
              resume (.pdf) &darr;
            </a>
          </div>
        </section>

        <footer className="sm-footer">
          <span>&copy; 2026 steven mettler</span>
          <Link href="/guestbook">guestbook</Link>
          <span>set in fragment mono</span>
        </footer>
      </div>
    </div>
  );
}
