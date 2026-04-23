import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TikTokPostDto {
  @ApiProperty({ example: '7364821903456781234' })
  id: string;

  @ApiProperty({ example: 'onigiri.spicy' })
  username: string;

  @ApiPropertyOptional({ example: 'Onigiri Spicy 🍙', nullable: true })
  nickName: string | null;

  @ApiPropertyOptional({ example: 'Le meilleur restaurant japonais de Paris 🍣 #foodieparis', nullable: true })
  caption: string | null;

  @ApiProperty({ example: 'https://www.tiktok.com/@onigiri.spicy/video/7364821903456781234' })
  url: string;

  @ApiProperty({ example: 'https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/cover.jpg' })
  coverUrl: string;

  @ApiProperty({ example: false })
  isSlideshow: boolean;

  @ApiProperty({ type: [String], example: [] })
  slideshowImages: string[];

  @ApiProperty({ type: [String], example: ['foodieparis', 'restaurantparis'] })
  hashtags: string[];

  @ApiProperty({ example: 4823 })
  likesCount: number;

  @ApiProperty({ example: 142 })
  commentsCount: number;

  @ApiProperty({ example: 98400 })
  playCount: number;

  @ApiProperty({ example: 67 })
  shareCount: number;

  @ApiProperty({ example: 210 })
  collectCount: number;

  @ApiProperty({ example: '2026-04-21T12:12:36.000Z' })
  timestamp: Date;

  @ApiPropertyOptional({ example: 'Paris, France', nullable: true })
  locationName: string | null;

  @ApiPropertyOptional({ example: '12 Rue de la Paix', nullable: true })
  locationAddress: string | null;

  @ApiPropertyOptional({ example: 'Paris', nullable: true })
  locationCity: string | null;

  @ApiPropertyOptional({ example: 'Sous le ciel de Paris', nullable: true })
  musicName: string | null;

  @ApiPropertyOptional({ example: 'Édith Piaf', nullable: true })
  musicAuthor: string | null;

  @ApiProperty({ example: false })
  isPinned: boolean;
}
