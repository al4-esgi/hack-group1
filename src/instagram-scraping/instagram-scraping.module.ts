import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { InstagramPostMapper } from './_utils/instagram-post.mapper';
import { ApifyScraperService } from './apify-scraper.service';
import { InstagramPostRepository } from './instagram-post.repository';
import { InstagramScrapingController } from './instagram-scraping.controller';
import { InstagramScrapingService } from './instagram-scraping.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    InstagramScrapingService,
    ApifyScraperService,
    InstagramPostRepository,
    InstagramPostMapper,
  ],
  controllers: [InstagramScrapingController],
})
export class InstagramScrapingModule {}
