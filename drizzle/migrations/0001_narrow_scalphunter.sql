CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "username" TO "email";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "password" TO "firstname";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "google_id" varchar;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'USER' NOT NULL;