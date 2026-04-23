import { index, integer, json, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const instagramPostTypeEnum = pgEnum('instagram_post_type', ['Image', 'Sidecar', 'Video']);
export const instagramSourceTypeEnum = pgEnum('instagram_source_type', ['hashtag', 'username']);

export const instagramPost = pgTable(
  'instagram_post',
  {
    id: varchar('id').primaryKey(),
    username: varchar('username').notNull(),
    fullName: varchar('full_name'),
    caption: text('caption'),
    type: instagramPostTypeEnum('type').notNull(),
    url: text('url').notNull(),
    displayUrl: text('display_url').notNull(),
    images: json('images').$type<string[]>().notNull().default([]),
    hashtags: json('hashtags').$type<string[]>().notNull().default([]),
    likesCount: integer('likes_count'),
    commentsCount: integer('comments_count').notNull().default(0),
    postTimestamp: timestamp('post_timestamp').notNull(),
    locationName: varchar('location_name'),
    sourceQuery: varchar('source_query').notNull(),
    sourceType: instagramSourceTypeEnum('source_type').notNull().default('hashtag'),
    scrapedAt: timestamp('scraped_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_instagram_post_source_query_type_scraped_at').on(table.sourceQuery, table.sourceType, table.scrapedAt),
  ],
);

export const selectInstagramPostSchema = createSelectSchema(instagramPost);
export type SelectInstagramPost = z.infer<typeof selectInstagramPostSchema>;
export type NewInstagramPost = typeof instagramPost.$inferInsert;
