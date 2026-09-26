CREATE TABLE "stua_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_body_len" CHECK (char_length(trim("stua_posts"."body")) between 1 and 10000),
	CONSTRAINT "post_status_valid" CHECK ("stua_posts"."status" in ('published', 'hidden'))
);
--> statement-breakpoint
CREATE TABLE "stua_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stua_rooms_slug_unique" UNIQUE("slug"),
	CONSTRAINT "room_slug_len" CHECK (char_length(trim("stua_rooms"."slug")) between 1 and 60),
	CONSTRAINT "room_name_len" CHECK (char_length(trim("stua_rooms"."name")) between 1 and 80)
);
--> statement-breakpoint
CREATE TABLE "stua_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"author_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"source_slug" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stua_threads_slug_unique" UNIQUE("slug"),
	CONSTRAINT "stua_threads_source_slug_unique" UNIQUE("source_slug"),
	CONSTRAINT "thread_title_len" CHECK (char_length(trim("stua_threads"."title")) between 1 and 160),
	CONSTRAINT "thread_status_valid" CHECK ("stua_threads"."status" in ('published', 'hidden'))
);
--> statement-breakpoint
ALTER TABLE "stua_posts" ADD CONSTRAINT "stua_posts_thread_id_stua_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."stua_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stua_posts" ADD CONSTRAINT "stua_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stua_threads" ADD CONSTRAINT "stua_threads_room_id_stua_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."stua_rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stua_threads" ADD CONSTRAINT "stua_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;