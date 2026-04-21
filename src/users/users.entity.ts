import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

export const user = pgTable('user', {
  id: serial().primaryKey(),
  password: varchar().notNull(),
  email: varchar().notNull(),
  firstname: varchar().notNull(),
  lastname: varchar().notNull(),
  ...timestamps,
});

export const selectUserSchema = createSelectSchema(user);
export type SelectUser = z.infer<typeof selectUserSchema>;
