CREATE TABLE "award_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "award_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_country_id_name_unique" UNIQUE("country_id","name")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cuisines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cuisines_name_unique" UNIQUE("name"),
	CONSTRAINT "cuisines_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"normalized_name" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "facilities_name_unique" UNIQUE("name"),
	CONSTRAINT "facilities_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "ingestion_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_name" varchar(255) NOT NULL,
	"source_hash" varchar(128) NOT NULL,
	"row_count" integer NOT NULL,
	"status" varchar(30) NOT NULL,
	"message" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_logs_status_check" CHECK ("ingestion_logs"."status" IN ('SUCCESS', 'FAILED'))
);
--> statement-breakpoint
CREATE TABLE "restaurant_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"award_type_id" integer NOT NULL,
	"stars_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_awards_restaurant_id_award_type_id_unique" UNIQUE("restaurant_id","award_type_id"),
	CONSTRAINT "restaurant_awards_stars_coherence_check" CHECK ("restaurant_awards"."stars_count" IS NULL OR "restaurant_awards"."stars_count" IN (1, 2, 3))
);
--> statement-breakpoint
CREATE TABLE "restaurant_cuisines" (
	"restaurant_id" integer NOT NULL,
	"cuisine_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_cuisines_restaurant_id_cuisine_id_pk" PRIMARY KEY("restaurant_id","cuisine_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_facilities" (
	"restaurant_id" integer NOT NULL,
	"facility_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_facilities_restaurant_id_facility_id_pk" PRIMARY KEY("restaurant_id","facility_id")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city_id" integer NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"phone_number" varchar(40),
	"source_url" varchar(500) NOT NULL,
	"website_url" varchar(500),
	"description" text NOT NULL,
	"price_level" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurants_price_level_check" CHECK ("restaurants"."price_level" IS NULL OR "restaurants"."price_level" BETWEEN 1 AND 4)
);
--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "username" TO "email";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastname" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_awards" ADD CONSTRAINT "restaurant_awards_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_awards" ADD CONSTRAINT "restaurant_awards_award_type_id_award_types_id_fk" FOREIGN KEY ("award_type_id") REFERENCES "public"."award_types"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_cuisine_id_cuisines_id_fk" FOREIGN KEY ("cuisine_id") REFERENCES "public"."cuisines"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_facilities" ADD CONSTRAINT "restaurant_facilities_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurant_facilities" ADD CONSTRAINT "restaurant_facilities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ingestion_logs_source_name_imported_at_idx" ON "ingestion_logs" USING btree ("source_name","imported_at");--> statement-breakpoint
CREATE INDEX "restaurant_awards_award_type_id_idx" ON "restaurant_awards" USING btree ("award_type_id");--> statement-breakpoint
CREATE INDEX "restaurant_cuisines_cuisine_id_idx" ON "restaurant_cuisines" USING btree ("cuisine_id");--> statement-breakpoint
CREATE INDEX "restaurant_facilities_facility_id_idx" ON "restaurant_facilities" USING btree ("facility_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_source_url_unique" ON "restaurants" USING btree ("source_url");--> statement-breakpoint
CREATE INDEX "restaurants_name_idx" ON "restaurants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "restaurants_city_id_name_idx" ON "restaurants" USING btree ("city_id","name");--> statement-breakpoint
CREATE INDEX "restaurants_city_id_idx" ON "restaurants" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "restaurants_latitude_longitude_idx" ON "restaurants" USING btree ("latitude","longitude");