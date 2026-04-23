import { Injectable, Logger } from '@nestjs/common';
import { InstagramPostMapper } from './_utils/instagram-post.mapper';
import { CACHE_FRESHNESS_HOURS } from './_utils/constants';
import { InstagramPostDto } from './_utils/dto/response/instagram-post.dto';
import { ApifyScraperService } from './apify-scraper.service';
import { InstagramPostRepository } from './instagram-post.repository';

type LocationFilters = {
  locationRequired?: boolean;
};

@Injectable()
export class InstagramScrapingService {
  private readonly logger = new Logger(InstagramScrapingService.name);

  constructor(
    private readonly apifyScraperService: ApifyScraperService,
    private readonly instagramPostRepository: InstagramPostRepository,
    private readonly instagramPostMapper: InstagramPostMapper,
  ) {}

  async getPostsByHashtags(hashtags: string[], limit: number, filters: LocationFilters): Promise<InstagramPostDto[]> {
    const results = await Promise.all(
      hashtags.map((tag) => this.fetchOrScrape(tag, 'hashtag', limit)),
    );
    return this.applyLocationFilters(results.flat(), filters);
  }

  async getPostsByUsernames(usernames: string[], limit: number, filters: LocationFilters): Promise<InstagramPostDto[]> {
    const results = await Promise.all(
      usernames.map((username) => this.fetchOrScrape(username, 'username', limit)),
    );
    return this.applyLocationFilters(results.flat(), filters);
  }

  private async fetchOrScrape(
    query: string,
    sourceType: 'hashtag' | 'username',
    limit: number,
  ): Promise<InstagramPostDto[]> {
    const cached = await this.instagramPostRepository.findFreshBySourceQuery(
      query,
      sourceType,
      CACHE_FRESHNESS_HOURS,
    );

    if (cached.length >= limit) {
      this.logger.log(`Cache hit for ${sourceType}:${query} (${cached.length} posts, need ${limit})`);
      return cached.slice(0, limit).map((entity) => this.instagramPostMapper.fromEntity(entity));
    }

    this.logger.log(`Cache insufficient for ${sourceType}:${query} (have ${cached.length}, need ${limit}), scraping...`);

    const rawItems =
      sourceType === 'hashtag'
        ? await this.apifyScraperService.scrapeByHashtags([query], limit)
        : await this.apifyScraperService.scrapeByUsernames([query], limit);

    const dtos = this.instagramPostMapper.toDtoList(rawItems);

    if (dtos.length === 0) {
      this.logger.warn(`No posts mapped for ${sourceType}:${query}`);
      return [];
    }

    const newPosts = dtos.map((dto) => this.instagramPostMapper.toEntity(dto, query, sourceType));
    await this.instagramPostRepository.saveBatch(newPosts);
    this.logger.log(`Saved ${newPosts.length} posts to DB for ${sourceType}:${query}`);

    return dtos;
  }

  private applyLocationFilters(posts: InstagramPostDto[], filters: LocationFilters): InstagramPostDto[] {
    if (filters.locationRequired === true) {
      return posts.filter((p) => p.locationName !== null);
    }
    return posts;
  }
}
