// One-off migration of the 7 posts from the original static site (../posts/*.html)
// into the Postgres posts table. Safe to re-run: uses ON CONFLICT (slug) DO NOTHING.
import { Client } from "pg";

const posts = [
  {
    slug: "helloworld",
    title: "helloworld",
    date: "2025-03-10",
    bodyMarkdown: `wrote some code today. latency spiked. traced it to a bad loop—O(n²) hiding in plain sight. fixed it, but it got me thinking: systems fail quietly until they don't. more later.`,
  },
  {
    slug: "a-start",
    title: "a start",
    date: "2025-03-14",
    bodyMarkdown: `pretty cool to do this in an hour. I wanted a new and simple website. It's always a gamble whether or not this will be posted to, but I have a good feeling about this one.`,
  },
  {
    slug: "devotionail",
    title: "devotionail",
    date: "2025-03-15",
    bodyMarkdown: `This is a basic llama3 wrapper that I wrote about a year ago. It seems really elementary now that there are such great free open source models out there to call. Either way, it's been running for all of that time with basically no usage. I am using [fly.io](https://www.fly.io), running python for the backend and the frontend sits on vercel.

Check it out - [link](http://www.devotionail.vercel.app)

![Generating a devotional about time](/assets/devotionail1.png)

![Landing page](/assets/devotionail2.png)`,
  },
  {
    slug: "i-can-post",
    title: "I can post",
    date: "2025-03-15",
    bodyMarkdown: `I finally got this to work. I had to do some exploring and fix the yml script that wasn't allowing my github actions to run correctly. It turns out I was using 'main' instead of 'master'. Oh well. Now, I should be able to just create an html file, commit, and see it autopopulate!`,
  },
  {
    slug: "skullbreaker",
    title: "skullbreaker",
    date: "2025-03-17",
    bodyMarkdown: `I vibe coded a little game I am calling Skullbreaker. You can play it [here](/games/skullbreaker).

I've been loving watching people on X create with AI tools. This one was done in a timespan of like 20 minutes as my wife and I watched wheel of time. Let me know what you think!`,
  },
  {
    slug: "json-prettifier",
    title: "json prettifier",
    date: "2025-03-24",
    bodyMarkdown: `It's become super easy to make lightweight tools with ai. I wanted to make a really simple json prettifier for when I just need one, whether it's school or work.

The project is here: [JSON Prettifier](/projects/json-prettifier)`,
  },
  {
    slug: "holidays",
    title: "holidays",
    date: "2025-12-17",
    bodyMarkdown: `Updating here because I haven't in a while. Some good news: my wife is 24 weeks pregnant! We will be spending the holidays on the east coast. Haven't been spending much time coding or creating new things; I definitely feel the urge to create, though.`,
  },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

for (const post of posts) {
  const createdAt = new Date(`${post.date}T12:00:00Z`);
  await client.query(
    `INSERT INTO posts (slug, title, body_markdown, published, created_at, updated_at)
     VALUES ($1, $2, $3, true, $4, $4)
     ON CONFLICT (slug) DO NOTHING`,
    [post.slug, post.title, post.bodyMarkdown, createdAt]
  );
  console.log(`seeded: ${post.slug}`);
}

await client.end();
