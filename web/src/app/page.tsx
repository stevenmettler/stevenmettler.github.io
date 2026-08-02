import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { GitHubActivity } from "./github-activity";
import { SiteBackground } from "./site-background";
import { getPublishedPosts } from "@/lib/posts";
import { getFeaturedGoal } from "@/lib/goals";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, featuredGoal] = await Promise.all([
    getPublishedPosts(),
    getFeaturedGoal(),
  ]);

  // Section numbers are derived rather than hardcoded so they stay contiguous
  // when the "currently" section comes and goes with a featured goal.
  const order = [
    "about",
    ...(featuredGoal ? ["currently"] : []),
    "work",
    "blog",
    "games",
    "contact",
  ];
  const num = (name: string) =>
    String(order.indexOf(name) + 1).padStart(2, "0");

  return (
    <div className="sm-site">
      <SiteBackground />
      <div className="sm-sheet">
        <nav className="sm-nav">
          <Link href="/">steven mettler</Link>
          <div className="sm-nav-links">
            <a href="#about">{num("about")} about</a>
            {featuredGoal ? (
              <a href="#currently">{num("currently")} currently</a>
            ) : null}
            <a href="#work">{num("work")} work</a>
            <a href="#blog">{num("blog")} blog</a>
            <a href="#games">{num("games")} games</a>
            <a href="#contact">{num("contact")} contact</a>
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
          <p className="sm-subtitle">Software&nbsp;Engineer</p>
          <p className="sm-quote">
            &ldquo;The reward of a work is to have produced it; the reward of
            effort is to have grown by it.&rdquo;
            <span className="sm-quote-attr">
              - Antonin&nbsp;Sertillanges
            </span>
          </p>
        </header>

        <section id="about" className="sm-section">
          <div className="sm-section-label">
            {num("about")}
            <br />
            ABOUT
          </div>
          <div className="sm-section-content sm-about-content">
            <p>
              Software engineer at Capital&nbsp;One, finishing a
              Master&rsquo;s in CS at Georgia&nbsp;Tech.
            </p>
            <p>
              Mostly I build small things for an audience of one: a reader that
              strips articles down to text, a tracker for the hours I want to
              spend on something, a couple of tiny games.
            </p>
            <p>
              Most of them exist because I wanted them and no one else was
              going to.
            </p>
          </div>
        </section>

        {featuredGoal ? (
          <section id="currently" className="sm-section">
            <div className="sm-section-label">
              {num("currently")}
              <br />
              CURRENTLY
            </div>
            <div className="sm-section-content">
              <div className="sm-goal-row">
                <span className="sm-goal-name">{featuredGoal.name}</span>
                <span className="sm-goal-percent">
                  {featuredGoal.percentComplete}%
                </span>
              </div>
              <div
                className="sm-goal-bar"
                role="progressbar"
                aria-label={`${featuredGoal.name} progress`}
                aria-valuenow={featuredGoal.percentComplete}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="sm-goal-bar-fill"
                  style={{ width: `${featuredGoal.percentComplete}%` }}
                />
              </div>
            </div>
          </section>
        ) : null}

        <section id="work" className="sm-section">
          <div className="sm-section-label">
            {num("work")}
            <br />
            WORK
          </div>
          <div className="sm-section-content">
            <div className="sm-work-row">
              <span>Capital&nbsp;One</span>
              <span className="sm-work-years">2022-</span>
            </div>
            <div className="sm-work-code">
              code: <a href="https://github.com/stevenmettler">github</a>
            </div>
            <GitHubActivity />
          </div>
        </section>

        <section id="blog" className="sm-section">
          <div className="sm-section-label">
            {num("blog")}
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
            {num("games")}
            <br />
            GAMES
          </div>
          <div className="sm-section-content sm-games-content">
            <Link href="/games/freefall">freefall</Link> - a small
            game about dodging obstacles
            <br />
            <Link href="/games/catacombs">catacombs</Link> - a tiny
            roguelike dungeon crawl
          </div>
        </section>

        <section id="contact" className="sm-section">
          <div className="sm-section-label sm-contact-label">
            {num("contact")}
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
