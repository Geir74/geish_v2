-- MERK: `auth.users` eies av Supabase og finnes allerede. Drizzle-kit
-- deklarerte den (schema.ts, kun for FK-referansen) og genererte derfor en
-- `create table "auth"."users"` her — den er MANUELT FJERNET, jf. mandatet:
-- migrasjonen skal ALDRI opprette/endre auth-skjemaet, kun referere auth.users(id)
-- for FK-en (design D1). FK-en nedenfor beholdes; den treffer den eksisterende
-- Supabase-tabellen. Snapshot i drizzle/meta beholder auth.users som "kjent", så
-- E5/E6-migrasjoner ikke prøver å gjenskape den.
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "display_name_len" CHECK ("profiles"."display_name" is null or char_length("profiles"."display_name") between 2 and 40),
	CONSTRAINT "bio_len" CHECK ("profiles"."bio" is null or char_length("profiles"."bio") <= 300)
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;