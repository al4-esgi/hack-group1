import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { GetTikTokPostType, NewTikTokPost, tiktokPost } from './tiktok-post.entity';

@Injectable()
export class TikTokPostRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findFreshBySourceQuery(
    sourceQuery: string,
    sourceType: 'hashtag' | 'username',
    freshnessHours: number,
  ): Promise<GetTikTokPostType[]> {
    const freshnessCutoff = new Date(Date.now() - freshnessHours * 3_600_000);

    return this.databaseService.db
      .select()
      .from(tiktokPost)
      .where(
        and(
          eq(tiktokPost.sourceQuery, sourceQuery),
          eq(tiktokPost.sourceType, sourceType),
          gte(tiktokPost.scrapedAt, freshnessCutoff),
        ),
      )
      .orderBy(desc(tiktokPost.postTimestamp));
  }

  async saveBatch(posts: NewTikTokPost[]): Promise<void> {
    if (posts.length === 0) return;

    await this.databaseService.db
      .insert(tiktokPost)
      .values(posts)
      .onConflictDoUpdate({
        target: tiktokPost.id,
        set: {
          likesCount: sql`excluded.likes_count`,
          commentsCount: sql`excluded.comments_count`,
          playCount: sql`excluded.play_count`,
          shareCount: sql`excluded.share_count`,
          collectCount: sql`excluded.collect_count`,
          coverUrl: sql`excluded.cover_url`,
          slideshowImages: sql`excluded.slideshow_images`,
          scrapedAt: sql`excluded.scraped_at`,
        },
      });
  }
}
