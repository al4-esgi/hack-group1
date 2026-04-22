import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { hotels } from './hotels.entity';
import { hotelAmenities } from './hotel-amenities.entity';

export const hotelHotelAmenities = pgTable(
  'hotel_hotel_amenities',
  {
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    amenityId: integer('amenity_id')
      .notNull()
      .references(() => hotelAmenities.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.hotelId, table.amenityId] }),
    index('hotel_hotel_amenities_hotel_id_idx').on(table.hotelId),
    index('hotel_hotel_amenities_amenity_id_idx').on(table.amenityId),
  ],
);
