import { Module } from '@nestjs/common';
import { InstagramScrapingService } from './instagram-scraping.service';
import { InstagramScrapingController } from './instagram-scraping.controller';

@Module({
  providers: [InstagramScrapingService],
  controllers: [InstagramScrapingController]
})
export class InstagramScrapingModule {}
