import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';
import { awardTypes } from './award-types.entity';
import { restaurants } from './restaurants.entity';
import { timestamps } from './_shared';

export const restaurantAwards = pgTable(
  'restaurant_awards',
  {
    id: serial('id').primaryKey(),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    awardTypeId: integer('award_type_id')
      .notNull()
      .references(() => awardTypes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    starsCount: integer('stars_count'),
    ...timestamps,
  },
  table => [
    check(
      'restaurant_awards_stars_coherence_check',
      sql`${table.starsCount} IS NULL OR ${table.starsCount} IN (1, 2, 3)`,
    ),
    unique('restaurant_awards_restaurant_id_award_type_id_unique').on(table.restaurantId, table.awardTypeId),
    index('restaurant_awards_award_type_id_idx').on(table.awardTypeId),
  ],
);

