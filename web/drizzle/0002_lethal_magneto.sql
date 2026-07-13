CREATE TABLE "post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"emoji" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_reactions_post_id_emoji_unique" UNIQUE("post_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;