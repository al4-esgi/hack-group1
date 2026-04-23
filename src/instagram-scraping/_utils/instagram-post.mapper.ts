import { Injectable, Logger } from '@nestjs/common';
import { NewInstagramPost, SelectInstagramPost } from '../instagram-post.entity';
import { InstagramPostDto } from './dto/response/instagram-post.dto';

const VALID_POST_TYPES = ['Image', 'Sidecar', 'Video'] as const;
type InstagramPostType = (typeof VALID_POST_TYPES)[number];

// Shape of a raw item returned by the Apify instagram-scraper actor.
// Typed as a loose record — fields are validated individually in toDto().
interface RawApifyPost {
  id?: unknown;
  ownerUsername?: unknown;
  ownerFullName?: unknown;
  caption?: unknown;
  type?: unknown;
  url?: unknown;
  displayUrl?: unknown;
  images?: unknown;
  hashtags?: unknown;
  likesCount?: unknown;
  commentsCount?: unknown;
  timestamp?: unknown;
  locationName?: unknown;
  inputUrl?: unknown;
}

@Injectable()
export class InstagramPostMapper {
  private readonly logger = new Logger(InstagramPostMapper.name);

  toDto(raw: unknown): InstagramPostDto {
    const item = raw as RawApifyPost;

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      throw new Error(`Apify item is missing required field 'id': ${JSON.stringify(raw)}`);
    }

    if (typeof item.ownerUsername !== 'string' || item.ownerUsername.trim() === '') {
      throw new Error(`Apify item is missing required field 'ownerUsername': ${JSON.stringify(raw)}`);
    }

    const type = this.parseType(item.type);

    const displayUrl = typeof item.displayUrl === 'string'
      ? item.displayUrl
      : (() => {
          this.logger.warn(`Post ${item.id} is missing 'displayUrl'`);
          return '';
        })();

    const url = typeof item.url === 'string'
      ? item.url
      : (() => {
          this.logger.warn(`Post ${item.id} is missing 'url'`);
          return '';
        })();

    const timestamp = new Date(item.timestamp as string);
    if (isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp for post ${item.id}: ${item.timestamp}`);
    }

    const images = this.parseImages(item.images, type, displayUrl);
    const likesCount = this.parseLikesCount(item.likesCount);

    if (likesCount === null && item.likesCount !== -1) {
      this.logger.warn(`Unexpected likesCount value for post ${item.id}: ${item.likesCount}`);
    }

    return {
      id: item.id.trim(),
      username: item.ownerUsername.trim(),
      fullName: typeof item.ownerFullName === 'string' && item.ownerFullName.trim() !== ''
        ? item.ownerFullName.trim()
        : null,
      caption: typeof item.caption === 'string' && item.caption.trim() !== ''
        ? item.caption.trim()
        : null,
      type,
      url,
      // Instagram image URLs embed an expiry token (oe= param) and expire after a few hours.
      // A re-scrape or URL refresh mechanism will be needed in the future.
      displayUrl,
      images,
      hashtags: Array.isArray(item.hashtags)
        ? (item.hashtags as unknown[]).filter((h): h is string => typeof h === 'string')
        : [],
      likesCount,
      commentsCount: typeof item.commentsCount === 'number' && item.commentsCount >= 0
        ? item.commentsCount
        : 0,
      timestamp,
      locationName: typeof item.locationName === 'string' && item.locationName.trim() !== ''
        ? item.locationName.trim()
        : null,
    };
  }

  toDtoList(items: unknown[]): InstagramPostDto[] {
    return items
      .map((item, index) => {
        try {
          return this.toDto(item);
        } catch (error) {
          this.logger.warn(
            `Skipping Apify item at index ${index} due to mapping error: ${(error as Error).message}`,
          );
          return null;
        }
      })
      .filter((dto): dto is InstagramPostDto => dto !== null);
  }

  fromEntity(entity: SelectInstagramPost): InstagramPostDto {
    return {
      id: entity.id,
      username: entity.username,
      fullName: entity.fullName ?? null,
      caption: entity.caption ?? null,
      type: entity.type as InstagramPostType,
      url: entity.url,
      displayUrl: entity.displayUrl,
      images: (entity.images as string[]) ?? [],
      hashtags: (entity.hashtags as string[]) ?? [],
      likesCount: entity.likesCount ?? null,
      commentsCount: entity.commentsCount ?? 0,
      timestamp: entity.postTimestamp,
      locationName: entity.locationName ?? null,
    };
  }

  toEntity(dto: InstagramPostDto, sourceQuery: string, sourceType: 'hashtag' | 'username'): NewInstagramPost {
    return {
      id: dto.id,
      username: dto.username,
      fullName: dto.fullName,
      caption: dto.caption,
      type: dto.type,
      url: dto.url,
      displayUrl: dto.displayUrl,
      images: dto.images,
      hashtags: dto.hashtags,
      likesCount: dto.likesCount,
      commentsCount: dto.commentsCount,
      postTimestamp: dto.timestamp,
      locationName: dto.locationName,
      sourceQuery,
      sourceType,
      scrapedAt: new Date(),
    };
  }

  private parseType(raw: unknown): InstagramPostType {
    if (!VALID_POST_TYPES.includes(raw as InstagramPostType)) {
      throw new Error(`Unknown instagram post type received from Apify: '${raw}'`);
    }
    return raw as InstagramPostType;
  }

  private parseImages(raw: unknown, type: InstagramPostType, displayUrl: string): string[] {
    const images = Array.isArray(raw)
      ? (raw as unknown[]).filter((url): url is string => typeof url === 'string')
      : [];

    if (images.length === 0 && type === 'Image') {
      if (displayUrl) {
        return [displayUrl];
      }
      this.logger.warn(`Post of type 'Image' has no images and no displayUrl`);
    }

    return images;
  }

  private parseLikesCount(raw: unknown): number | null {
    if (typeof raw !== 'number') return null;
    if (raw === -1) return null;
    return raw;
  }
}
