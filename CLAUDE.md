# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Steven Mettler's personal site, served via GitHub Pages at stevenmettler.com (see `CNAME`). It's static HTML/CSS/JS — no build step, no framework, no package.json, no test suite.

## Working locally

There is no dev server or build command. Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python3 -m http.server`) to test relative links/paths correctly.

## Blog post generation

`scripts.js` is a **generated file**, not hand-written — it's produced by `generate-posts.js` from the contents of `posts/`. After adding, renaming, or removing a post file, regenerate it:

```
node generate-posts.js
```

This reads every `*.html` file in `posts/`, parses the filename as `YYYY-MM-DD-title-with-dashes.html` (date = first three dash-separated segments, title = the rest with dashes turned into spaces), sorts newest-first, and overwrites `scripts.js` with a `posts` array plus the script that renders links into `<div id="blog-posts">` on the homepage. Do not hand-edit `scripts.js`; edit `generate-posts.js` or the post filenames/content instead, then regenerate.

Because the date/title are derived purely from the filename, new posts must follow the `YYYY-MM-DD-title-words.html` naming convention exactly for the generator to parse them correctly.

## Adding a new blog post

1. Copy `2025-03-14-template.html` (or an existing post in `posts/`) into `posts/YYYY-MM-DD-title.html`.
2. Posts are one level deeper than the site root, so the stylesheet link and back link use `../` (`../styles.css`, `../index.html`).
3. Content lives inside a `<pre>` block styled as monospace plain text — keep that structure for visual consistency with existing posts.
4. Run `node generate-posts.js` to regenerate `scripts.js` so the new post shows up on the homepage.

## Structure

- `index.html` — homepage; content is a single `<pre>` block (terminal/plaintext aesthetic) with an `.about`, `.work`, `.blog`, `.games`, `.contact`, `.resume` section layout. The `.blog` section is populated at runtime by `scripts.js` filling `#blog-posts`.
- `posts/` — individual blog post pages, each self-contained HTML using the shared `styles.css`.
- `projects/` — standalone sub-projects, each in its own directory with its own HTML/CSS/JS (e.g. `projects/json-prettifier/`). These are independent mini-apps, not part of the main page template.
- `skullbreaker.html` — a standalone Three.js browser game at the site root, linked from the `.games` section of `index.html`. It pulls Three.js from a CDN (`cdnjs.cloudflare.com`) and is entirely self-contained (inline `<style>` and `<script>`), unlike the `posts/`/`projects/` pages which link external `styles.css`/`.js` files.
- `styles.css` — shared stylesheet for the homepage and blog posts (monospace, narrow centered container, minimal color palette). Project pages under `projects/` and `skullbreaker.html` have their own separate styles instead of using this file.

## Conventions

- Site-wide look is deliberately minimal/plaintext: monospace font, small max-width container, sparse color. Match this when touching `index.html`, `posts/`, or `styles.css`.
- Post and project pages are static and self-contained — no shared JS bundler or module system; scripts are plain `<script src="...">` tags.
