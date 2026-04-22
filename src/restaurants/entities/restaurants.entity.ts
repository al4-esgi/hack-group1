import { check, index, integer, numeric, pgTable, serial, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { geographyPoint } from 'src/_shared/geo/geography-point.type';
import { cities } from './cities.entity';
import { timestamps } from './_shared';

export const restaurants = pgTable(
  'restaurants',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),
    cityId: integer('city_id')
      .notNull()
      .references(() => cities.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
    longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 40 }),
    sourceUrl: varchar('source_url', { length: 500 }).notNull(),
    websiteUrl: varchar('website_url', { length: 500 }),
    description: text('description').notNull(),
    priceLevel: integer('price_level'),
    location: geographyPoint('location'),
    ...timestamps,
  },
  table => [
    check('restaurants_price_level_check', sql`${table.priceLevel} IS NULL OR ${table.priceLevel} BETWEEN 1 AND 4`),
    uniqueIndex('restaurants_source_url_unique').on(table.sourceUrl),
    index('restaurants_name_idx').on(table.name),
    index('restaurants_city_id_name_idx').on(table.cityId, table.name),
    index('restaurants_city_id_idx').on(table.cityId),
    index('restaurants_latitude_longitude_idx').on(table.latitude, table.longitude),
    index('restaurants_location_gist_idx').using('gist', table.location),
  ],
);

