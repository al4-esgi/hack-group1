import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { TIKTOK_ACTOR_ID } from './_utils/constants';

@Injectable()
export class TikTokScraperService {
  private readonly logger = new Logger(TikTokScraperService.name);
  private readonly apifyClient: ApifyClient;

  constructor(private readonly configService: ConfigService) {
    this.apifyClient = new ApifyClient({
      token: this.configService.get<string>('APIFY_TOKEN'),
    });
  }

  async scrapeByHashtags(hashtags: string[], limit: number): Promise<unknown[]> {
    this.logger.log(`Starting TikTok scrape by hashtags — [${hashtags.join(', ')}], limit: ${limit}`);

    const input = {
      hashtags,
      resultsPerPage: limit,
      excludePinnedPosts: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false,
    };

    return this.runActor(input);
  }

  async scrapeByUsernames(usernames: string[], limit: number): Promise<unknown[]> {
    this.logger.log(`Starting TikTok scrape by usernames — [${usernames.join(', ')}], limit: ${limit}`);

    const input = {
      profiles: usernames,
      resultsPerPage: limit,
      profileScrapeSections: ['videos'],
      profileSorting: 'latest',
      excludePinnedPosts: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false,
    };

    return this.runActor(input);
  }

  private async runActor(input: unknown): Promise<unknown[]> {
    try {
      const run = await this.apifyClient.actor(TIKTOK_ACTOR_ID).call(input as Record<string, unknown>);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      this.logger.log(`TikTok scrape completed — retrieved ${items.length} items`);

      return items;
    } catch (error) {
      this.logger.error(`TikTok Apify scrape failed: ${(error as Error).message}`, (error as Error).stack);
      throw new ServiceUnavailableException('Failed to scrape TikTok via Apify');
    }
  }
}
