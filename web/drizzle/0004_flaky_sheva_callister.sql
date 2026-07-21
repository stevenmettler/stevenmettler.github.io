CREATE TABLE "game_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"bones" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_profiles_player_id_unique" UNIQUE("player_id")
);
--> statement-breakpoint
CREATE TABLE "game_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"class_key" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"turns" integer DEFAULT 0 NOT NULL,
	"bones_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"unlock_key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_unlocks_player_id_unlock_key_unique" UNIQUE("player_id","unlock_key")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
ALTER TABLE "game_profiles" ADD CONSTRAINT "game_profiles_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_runs" ADD CONSTRAINT "game_runs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_unlocks" ADD CONSTRAINT "game_unlocks_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;