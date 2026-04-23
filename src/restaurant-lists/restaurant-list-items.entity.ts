import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { restaurantLists } from './restaurant-lists.entity';

export const restaurantListItems = pgTable(
  'restaurant_list_items',
  {
    id: serial('id').primaryKey(),
    listId: integer('list_id')
      .notNull()
      .references(() => restaurantLists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    itemType: varchar('item_type', { length: 40 }).notNull(),
    itemId: integer('item_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  table => [
    index('restaurant_list_items_list_id_idx').on(table.listId),
    index('restaurant_list_items_type_id_idx').on(table.itemType, table.itemId),
    uniqueIndex('restaurant_list_items_list_id_type_item_id_unique').on(table.listId, table.itemType, table.itemId),
  ],
);

export type SelectRestaurantListItem = typeof restaurantListItems.$inferSelect;
