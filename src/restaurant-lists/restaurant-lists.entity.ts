import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from 'src/users/users.entity';

const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

export const restaurantLists = pgTable(
  'restaurant_lists',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 80 }).notNull(),
    ...timestamps,
  },
  table => [
    index('restaurant_lists_user_id_idx').on(table.userId),
    uniqueIndex('restaurant_lists_user_id_normalized_name_unique').on(table.userId, table.normalizedName),
  ],
);

export type SelectRestaurantList = typeof restaurantLists.$inferSelect;
