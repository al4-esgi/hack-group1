import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const ingestionLogs = pgTable(
  'ingestion_logs',
  {
    id: serial('id').primaryKey(),
    sourceName: varchar('source_name', { length: 255 }).notNull(),
    sourceHash: varchar('source_hash', { length: 128 }).notNull(),
    rowCount: integer('row_count').notNull(),
    status: varchar('status', { length: 30 }).notNull(),
    message: text('message'),
    importedAt: timestamp('imported_at').notNull().defaultNow(),
  },
  table => [
    check('ingestion_logs_status_check', sql`${table.status} IN ('SUCCESS', 'FAILED')`),
    index('ingestion_logs_source_name_imported_at_idx').on(table.sourceName, table.importedAt),
  ],
);

