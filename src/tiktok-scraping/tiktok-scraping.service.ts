import { Injectable, Logger } from "@nestjs/common";
import { CACHE_FRESHNESS_HOURS } from "./_utils/constants";
import { TikTokPostDto } from "./_utils/dto/response/tiktok-post.dto";
import { TikTokPostMapper } from "./_utils/tiktok-post.mapper";
import { TikTokPostRepository } from "./tiktok-post.repository";
import { TikTokScraperService } from "./tiktok-scraper.service";

type LocationFilters = {
  city?: string;
  addressContains?: string;
  locationRequired?: boolean;
};

@Injectable()
export class TikTokScrapingService {
  private readonly logger = new Logger(TikTokScrapingService.name);

  constructor(
    private readonly tiktokScraperService: TikTokScraperService,
    private readonly tiktokPostRepository: TikTokPostRepository,
    private readonly mapper: TikTokPostMapper,
  ) {}

  async getPostsByHashtags(
    hashtags: string[],
    limit: number,
    filters: LocationFilters,
  ): Promise<TikTokPostDto[]> {
    const results = await Promise.all(
      hashtags.map((tag) => this.fetchOrScrape(tag, "hashtag", limit)),
    );
    return this.applyLocationFilters(results.flat(), filters);
  }

  async getPostsByUsernames(
    usernames: string[],
    limit: number,
    filters: LocationFilters,
  ): Promise<TikTokPostDto[]> {
    const results = await Promise.all(
      usernames.map((username) =>
        this.fetchOrScrape(username, "username", limit),
      ),
    );
    return this.applyLocationFilters(results.flat(), filters);
  }

  private async fetchOrScrape(
    query: string,
    sourceType: "hashtag" | "username",
    limit: number,
  ): Promise<TikTokPostDto[]> {
    const cached = await this.tiktokPostRepository.findFreshBySourceQuery(
      query,
      sourceType,
      CACHE_FRESHNESS_HOURS,
    );

    if (cached.length >= limit) {
      this.logger.log(
        `Cache hit for ${sourceType}:${query} (${cached.length} posts, need ${limit})`,
      );
      return cached
        .slice(0, limit)
        .map((entity) => this.mapper.fromEntity(entity));
    }

    this.logger.log(
      `Cache insufficient for ${sourceType}:${query} (have ${cached.length}, need ${limit}), scraping...`,
    );

    const rawItems =
      sourceType === "hashtag"
        ? await this.tiktokScraperService.scrapeByHashtags([query], limit)
        : await this.tiktokScraperService.scrapeByUsernames([query], limit);

    const dtos = this.mapper.toDtoList(rawItems);

    if (dtos.length === 0) {
      this.logger.warn(`No posts mapped for ${sourceType}:${query}`);
      return [];
    }

    const newPosts = dtos.map((dto) =>
      this.mapper.toEntity(dto, query, sourceType),
    );
    await this.tiktokPostRepository.saveBatch(newPosts);
    this.logger.log(
      `Saved ${newPosts.length} posts to DB for ${sourceType}:${query}`,
    );

    return dtos;
  }

  private applyLocationFilters(
    posts: TikTokPostDto[],
    filters: LocationFilters,
  ): TikTokPostDto[] {
    let result = posts;

    if (filters.locationRequired === true) {
      result = result.filter((p) => p.locationName !== null);
    }

    if (filters.city !== undefined) {
      const city = filters.city.toLowerCase();
      result = result.filter((p) => p.locationCity?.toLowerCase() === city);
    }

    if (filters.addressContains !== undefined) {
      const substring = filters.addressContains.toLowerCase();
      result = result.filter((p) =>
        p.locationAddress?.toLowerCase().includes(substring),
      );
    }

    return result;
  }
}
