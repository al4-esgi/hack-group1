import { index, integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { restaurants } from 'src/restaurants/entities/restaurants.entity';
import { restaurantLists } from './restaurant-lists.entity';

export const restaurantListRestaurants = pgTable(
  'restaurant_list_restaurants',
  {
    listId: integer('list_id')
      .notNull()
      .references(() => restaurantLists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    restaurantId: integer('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  table => [
    primaryKey({
      columns: [table.listId, table.restaurantId],
      name: 'restaurant_list_restaurants_pk',
    }),
    index('restaurant_list_restaurants_list_id_idx').on(table.listId),
    index('restaurant_list_restaurants_restaurant_id_idx').on(table.restaurantId),
  ],
);

export type SelectRestaurantListRestaurant = typeof restaurantListRestaurants.$inferSelect;
