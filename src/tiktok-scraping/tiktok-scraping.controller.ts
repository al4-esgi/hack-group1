import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HashtagsQueryDto } from './_utils/dto/request/hashtags-query.dto';
import { UsernamesQueryDto } from './_utils/dto/request/usernames-query.dto';
import { TikTokPostDto } from './_utils/dto/response/tiktok-post.dto';
import { TikTokScrapingService } from './tiktok-scraping.service';

@ApiTags('TikTok Scraping')
@Controller('tiktok-scraping')
export class TikTokScrapingController {
  constructor(private readonly tiktokScrapingService: TikTokScrapingService) {}

  @Get('hashtags')
  @ApiOperation({ summary: 'Scrape TikTok posts by hashtags (cached 24h) with optional location filters' })
  @ApiOkResponse({ type: [TikTokPostDto] })
  getByHashtags(@Query() query: HashtagsQueryDto): Promise<TikTokPostDto[]> {
    return this.tiktokScrapingService.getPostsByHashtags(query.tags, query.limit, {
      city: query.city,
      addressContains: query.addressContains,
      locationRequired: query.locationRequired,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Scrape TikTok posts by usernames (cached 24h) with optional location filters' })
  @ApiOkResponse({ type: [TikTokPostDto] })
  getByUsernames(@Query() query: UsernamesQueryDto): Promise<TikTokPostDto[]> {
    return this.tiktokScrapingService.getPostsByUsernames(query.usernames, query.limit, {
      city: query.city,
      addressContains: query.addressContains,
      locationRequired: query.locationRequired,
    });
  }
}
