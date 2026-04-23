import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TikTokPostMapper } from './_utils/tiktok-post.mapper';
import { TikTokPostRepository } from './tiktok-post.repository';
import { TikTokScraperService } from './tiktok-scraper.service';
import { TikTokScrapingController } from './tiktok-scraping.controller';
import { TikTokScrapingService } from './tiktok-scraping.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TikTokScrapingController],
  providers: [
    TikTokScrapingService,
    TikTokScraperService,
    TikTokPostRepository,
    TikTokPostMapper,
  ],
})
export class TikTokScrapingModule {}
