import { Injectable, Logger } from '@nestjs/common';
import { GetTikTokPostType, NewTikTokPost } from '../tiktok-post.entity';
import { TikTokPostDto } from './dto/response/tiktok-post.dto';

// Shape of a raw item returned by the Apify clockworks/tiktok-scraper actor.
// Typed as a loose record — fields are validated individually in toDto().
interface RawApifyTikTokPost {
  id?: unknown;
  authorMeta?: {
    name?: unknown;
    nickName?: unknown;
  };
  text?: unknown;
  webVideoUrl?: unknown;
  videoMeta?: {
    coverUrl?: unknown;
  };
  isSlideshow?: unknown;
  slideshowImageLinks?: unknown;
  hashtags?: unknown;
  diggCount?: unknown;
  commentCount?: unknown;
  playCount?: unknown;
  shareCount?: unknown;
  collectCount?: unknown;
  createTimeISO?: unknown;
  locationMeta?: {
    locationName?: unknown;
    address?: unknown;
    city?: unknown;
  };
  musicMeta?: {
    musicName?: unknown;
    musicAuthor?: unknown;
  };
  isPinned?: unknown;
}

@Injectable()
export class TikTokPostMapper {
  private readonly logger = new Logger(TikTokPostMapper.name);

  toDto(raw: unknown): TikTokPostDto {
    const item = raw as RawApifyTikTokPost;

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      throw new Error(`Apify item is missing required field 'id': ${JSON.stringify(raw)}`);
    }

    if (typeof item.authorMeta?.name !== 'string' || item.authorMeta.name.trim() === '') {
      throw new Error(`Apify item is missing required field 'authorMeta.name' for id=${item.id}`);
    }

    if (typeof item.createTimeISO !== 'string') {
      throw new Error(`Missing or invalid createTimeISO for post id=${item.id}`);
    }
    const timestamp = new Date(item.createTimeISO);
    if (isNaN(timestamp.getTime())) {
      throw new Error(`Invalid createTimeISO for post id=${item.id}: ${item.createTimeISO}`);
    }

    const url = typeof item.webVideoUrl === 'string'
      ? item.webVideoUrl
      : (() => {
          this.logger.warn(`Post id=${item.id} is missing 'webVideoUrl'`);
          return '';
        })();

    const coverUrl = typeof item.videoMeta?.coverUrl === 'string'
      ? item.videoMeta.coverUrl
      : (() => {
          this.logger.warn(`Post id=${item.id} is missing 'videoMeta.coverUrl'`);
          return '';
        })();

    return {
      id: item.id.trim(),
      username: item.authorMeta.name.trim(),
      nickName: typeof item.authorMeta?.nickName === 'string' && item.authorMeta.nickName.trim() !== ''
        ? item.authorMeta.nickName.trim()
        : null,
      caption: typeof item.text === 'string' && item.text.trim() !== ''
        ? item.text.trim()
        : null,
      url,
      coverUrl,
      isSlideshow: item.isSlideshow === true,
      slideshowImages: this.parseSlideshowImages(item.slideshowImageLinks),
      hashtags: this.parseHashtags(item.hashtags),
      likesCount: typeof item.diggCount === 'number' ? item.diggCount : 0,
      commentsCount: typeof item.commentCount === 'number' ? item.commentCount : 0,
      playCount: typeof item.playCount === 'number' ? item.playCount : 0,
      shareCount: typeof item.shareCount === 'number' ? item.shareCount : 0,
      collectCount: typeof item.collectCount === 'number' ? item.collectCount : 0,
      timestamp,
      locationName: typeof item.locationMeta?.locationName === 'string' && item.locationMeta.locationName.trim() !== ''
        ? item.locationMeta.locationName.trim()
        : null,
      locationAddress: typeof item.locationMeta?.address === 'string' && item.locationMeta.address.trim() !== ''
        ? item.locationMeta.address.trim()
        : null,
      locationCity: typeof item.locationMeta?.city === 'string' && item.locationMeta.city.trim() !== ''
        ? item.locationMeta.city.trim()
        : null,
      musicName: typeof item.musicMeta?.musicName === 'string' && item.musicMeta.musicName.trim() !== ''
        ? item.musicMeta.musicName.trim()
        : null,
      musicAuthor: typeof item.musicMeta?.musicAuthor === 'string' && item.musicMeta.musicAuthor.trim() !== ''
        ? item.musicMeta.musicAuthor.trim()
        : null,
      isPinned: item.isPinned === true,
    };
  }

  toDtoList(items: unknown[]): TikTokPostDto[] {
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
      .filter((dto): dto is TikTokPostDto => dto !== null);
  }

  fromEntity(entity: GetTikTokPostType): TikTokPostDto {
    return {
      id: entity.id,
      username: entity.username,
      nickName: entity.nickName ?? null,
      caption: entity.caption ?? null,
      url: entity.url,
      coverUrl: entity.coverUrl,
      isSlideshow: entity.isSlideshow,
      slideshowImages: entity.slideshowImages as string[],
      hashtags: entity.hashtags as string[],
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      playCount: entity.playCount,
      shareCount: entity.shareCount,
      collectCount: entity.collectCount,
      timestamp: entity.postTimestamp,
      locationName: entity.locationName ?? null,
      locationAddress: entity.locationAddress ?? null,
      locationCity: entity.locationCity ?? null,
      musicName: entity.musicName ?? null,
      musicAuthor: entity.musicAuthor ?? null,
      isPinned: entity.isPinned,
    };
  }

  toEntity(dto: TikTokPostDto, sourceQuery: string, sourceType: 'hashtag' | 'username'): NewTikTokPost {
    return {
      id: dto.id,
      username: dto.username,
      nickName: dto.nickName,
      caption: dto.caption,
      url: dto.url,
      coverUrl: dto.coverUrl,
      isSlideshow: dto.isSlideshow,
      slideshowImages: dto.slideshowImages,
      hashtags: dto.hashtags,
      likesCount: dto.likesCount,
      commentsCount: dto.commentsCount,
      playCount: dto.playCount,
      shareCount: dto.shareCount,
      collectCount: dto.collectCount,
      postTimestamp: dto.timestamp,
      locationName: dto.locationName,
      locationAddress: dto.locationAddress,
      locationCity: dto.locationCity,
      musicName: dto.musicName,
      musicAuthor: dto.musicAuthor,
      isPinned: dto.isPinned,
      sourceQuery,
      sourceType,
    };
  }

  private parseHashtags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];

    return (raw as unknown[])
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'name' in item) {
          return (item as { name: unknown }).name;
        }
        return null;
      })
      .filter((name): name is string => typeof name === 'string' && name.length >= 2);
  }

  private parseSlideshowImages(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];

    return (raw as unknown[])
      .map((item) => {
        if (typeof item === 'object' && item !== null && 'tiktokLink' in item) {
          return (item as { tiktokLink: unknown }).tiktokLink;
        }
        return null;
      })
      .filter((link): link is string => typeof link === 'string' && link.length > 0);
  }
}
