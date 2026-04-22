import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { timestamps } from "src/restaurants/entities/_shared";
import { cities } from "src/restaurants/entities/cities.entity";
import { countries } from "src/restaurants/entities/countries.entity";
import { z } from "zod";

export const hotels = pgTable(
  "hotels",
  {
    id: serial("id").primaryKey(),
    objectId: varchar("object_id", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }),
    originalSlug: varchar("original_slug", { length: 255 }),
    canonicalUrl: varchar("canonical_url", { length: 500 }),
    content: text("content"),
    address: varchar("address", { length: 500 }),
    phone: varchar("phone", { length: 120 }),
    postalCode: varchar("postal_code", { length: 40 }),
    neighborhood: varchar("neighborhood", { length: 120 }),
    currency: varchar("currency", { length: 10 }),
    cityId: integer("city_id").references(() => cities.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    countryId: integer("country_id").references(() => countries.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    regionName: varchar("region_name", { length: 120 }),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    checkInTime: real("check_in_time"),
    checkOutTime: real("check_out_time"),
    numRooms: integer("num_rooms"),
    numReviews: integer("num_reviews"),
    lovedCount: integer("loved_count"),
    commissionRate: real("commission_rate"),
    maxGuests: integer("max_guests"),
    maxChildren: integer("max_children"),
    bookable: boolean("bookable"),
    isPlus: boolean("is_plus"),
    sustainableHotel: boolean("sustainable_hotel"),
    newToSelection: boolean("new_to_selection"),
    hotelId: varchar("hotel_id", { length: 40 }),
    bookingDotComHotelId: integer("booking_dot_com_hotel_id"),
    mainImageUrl: varchar("main_image_url", { length: 500 }),
    distinctions: varchar("distinction", { length: 60 }),
    criteriaAtmosphere: varchar("criteria_atmosphere", { length: 120 }),
    criteriaStyle: varchar("criteria_style", { length: 120 }),
    appClipBannerUrl: varchar("app_clip_banner_url", { length: 500 }),
    shortLink: varchar("short_link", { length: 500 }),
    michelinGuideUrl: varchar("michelin_guide_url", { length: 500 }),
    url: varchar("url", { length: 500 }),
    policy: text("policy"),
    languages: jsonb("languages").$type<string[]>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hotels_object_id_unique").on(table.objectId),
    index("hotels_city_id_idx").on(table.cityId),
    index("hotels_country_id_idx").on(table.countryId),
    index("hotels_name_idx").on(table.name),
    index("hotels_lat_lng_idx").on(table.lat, table.lng),
  ],
);

export const selectHotelSchema = createSelectSchema(hotels);
export type SelectHotel = z.infer<typeof selectHotelSchema>;
