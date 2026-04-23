import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HashtagsQueryDto } from './_utils/dto/request/hashtags-query.dto';
import { UsernamesQueryDto } from './_utils/dto/request/usernames-query.dto';
import { InstagramPostDto } from './_utils/dto/response/instagram-post.dto';
import { InstagramScrapingService } from './instagram-scraping.service';

@ApiTags('Instagram Scraping')
@Controller('instagram-scraping')
export class InstagramScrapingController {
  constructor(private readonly instagramScrapingService: InstagramScrapingService) {}

  @Get('hashtags')
  @ApiOperation({ summary: 'Scrape Instagram posts by hashtags (cached 24h) with optional location filter' })
  @ApiOkResponse({ type: [InstagramPostDto] })
  getByHashtags(@Query() query: HashtagsQueryDto): Promise<InstagramPostDto[]> {
    return this.instagramScrapingService.getPostsByHashtags(query.tags, query.limit, {
      locationRequired: query.locationRequired,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Scrape Instagram posts by usernames (cached 24h) with optional location filter' })
  @ApiOkResponse({ type: [InstagramPostDto] })
  getByUsernames(@Query() query: UsernamesQueryDto): Promise<InstagramPostDto[]> {
    return this.instagramScrapingService.getPostsByUsernames(query.usernames, query.limit, {
      locationRequired: query.locationRequired,
    });
  }
}
