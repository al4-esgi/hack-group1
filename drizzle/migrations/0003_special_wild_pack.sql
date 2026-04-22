CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" NOT NULL;