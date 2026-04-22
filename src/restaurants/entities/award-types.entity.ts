import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

export const awardTypes = pgTable('award_types', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 40 }).notNull().unique(),
  ...timestamps,
});

