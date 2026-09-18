CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "author_name_len" CHECK (char_length(trim("guestbook_entries"."author_name")) between 1 and 60),
	CONSTRAINT "body_len" CHECK (char_length(trim("guestbook_entries"."body")) between 1 and 2000),
	CONSTRAINT "status_valid" CHECK ("guestbook_entries"."status" in ('pending', 'published', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;