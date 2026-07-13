CREATE TABLE "guestbook_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
