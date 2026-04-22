import { index, integer, pgTable, serial, unique, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from 'src/restaurants/entities/_shared';

export const hotelAmenities = pgTable(
  'hotel_amenities',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 140 }).notNull(),
    ...timestamps,
  },
  table => [unique('hotel_amenities_normalized_name_unique').on(table.normalizedName)],
);
