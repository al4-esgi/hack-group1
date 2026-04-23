import { boolean, index, integer, json, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const tiktokSourceTypeEnum = pgEnum('tiktok_source_type', ['hashtag', 'username']);

export const tiktokPost = pgTable(
  'tiktok_post',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    nickName: varchar('nick_name', { length: 255 }),
    caption: text('caption'),
    url: text('url').notNull(),
    coverUrl: text('cover_url').notNull(),
    isSlideshow: boolean('is_slideshow').notNull().default(false),
    slideshowImages: json('slideshow_images').$type<string[]>().notNull().default([]),
    hashtags: json('hashtags').$type<string[]>().notNull().default([]),
    likesCount: integer('likes_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    playCount: integer('play_count').notNull().default(0),
    shareCount: integer('share_count').notNull().default(0),
    collectCount: integer('collect_count').notNull().default(0),
    postTimestamp: timestamp('post_timestamp').notNull(),
    locationName: varchar('location_name', { length: 255 }),
    locationAddress: varchar('location_address', { length: 500 }),
    locationCity: varchar('location_city', { length: 100 }),
    musicName: varchar('music_name', { length: 255 }),
    musicAuthor: varchar('music_author', { length: 255 }),
    isPinned: boolean('is_pinned').notNull().default(false),
    sourceQuery: varchar('source_query', { length: 100 }).notNull(),
    sourceType: tiktokSourceTypeEnum('source_type').notNull(),
    scrapedAt: timestamp('scraped_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_tiktok_post_source_query_type_scraped_at').on(
      table.sourceQuery,
      table.sourceType,
      table.scrapedAt,
    ),
  ],
);

export const getTikTokPostSchema = createSelectSchema(tiktokPost);
export type GetTikTokPostType = z.infer<typeof getTikTokPostSchema>;
export type NewTikTokPost = typeof tiktokPost.$inferInsert;
