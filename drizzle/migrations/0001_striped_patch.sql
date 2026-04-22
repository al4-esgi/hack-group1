ALTER TABLE "user" RENAME COLUMN "username" TO "email";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "googleId" varchar;