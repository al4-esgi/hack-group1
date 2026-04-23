import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApifyClient } from 'apify-client';
import { APIFY_ACTOR_ID, INSTAGRAM_HASHTAG_URL_PREFIX, INSTAGRAM_PROFILE_URL_PREFIX } from './_utils/constants';

@Injectable()
export class ApifyScraperService {
  private readonly logger = new Logger(ApifyScraperService.name);
  private readonly apifyClient: ApifyClient;

  constructor(private readonly configService: ConfigService) {
    this.apifyClient = new ApifyClient({
      token: this.configService.get<string>('APIFY_TOKEN'),
    });
  }

  async scrapeByHashtags(hashtags: string[], limit: number): Promise<unknown[]> {
    this.logger.log(`Starting Instagram scrape by hashtags — [${hashtags.join(', ')}], limit: ${limit}`);

    const input = {
      directUrls: hashtags.map((tag) => `${INSTAGRAM_HASHTAG_URL_PREFIX}${tag}/`),
      resultsType: 'posts',
      resultsLimit: limit,
    };

    return this.runActor(input);
  }

  async scrapeByUsernames(usernames: string[], limit: number): Promise<unknown[]> {
    this.logger.log(`Starting Instagram scrape by usernames — [${usernames.join(', ')}], limit: ${limit}`);

    const input = {
      directUrls: usernames.map((username) => `${INSTAGRAM_PROFILE_URL_PREFIX}${username}/`),
      resultsType: 'posts',
      resultsLimit: limit,
    };

    return this.runActor(input);
  }

  private async runActor(input: unknown): Promise<unknown[]> {
    try {
      const run = await this.apifyClient.actor(APIFY_ACTOR_ID).call(input as Record<string, unknown>);
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      this.logger.log(`Apify scrape completed — retrieved ${items.length} items`);

      return items;
    } catch (error) {
      this.logger.error(`Apify scrape failed: ${(error as Error).message}`, (error as Error).stack);
      throw new ServiceUnavailableException('Failed to scrape Instagram via Apify');
    }
  }
}
