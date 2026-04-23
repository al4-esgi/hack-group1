import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InstagramPostDto {
  @ApiProperty({ example: '3880180281403851728' })
  id: string;

  @ApiProperty({ example: 'lafabbricaparis' })
  username: string;

  @ApiPropertyOptional({ example: 'Bello & Buono' })
  fullName: string | null;

  @ApiPropertyOptional({ example: 'Amazing pasta tonight 🍝 #italienparis' })
  caption: string | null;

  @ApiProperty({ enum: ['Image', 'Sidecar', 'Video'], example: 'Sidecar' })
  type: 'Image' | 'Sidecar' | 'Video';

  @ApiProperty({ example: 'https://www.instagram.com/p/DXZK2hpjUPQ/' })
  url: string;

  @ApiProperty({ example: 'https://scontent-.../photo.jpg' })
  displayUrl: string;

  @ApiProperty({ type: [String], example: ['https://scontent-.../photo1.jpg'] })
  images: string[];

  @ApiProperty({ type: [String], example: ['italienparis', 'restaurantparis'] })
  hashtags: string[];

  @ApiPropertyOptional({ example: 4, nullable: true })
  likesCount: number | null;

  @ApiProperty({ example: 0 })
  commentsCount: number;

  @ApiProperty({ example: '2026-04-21T12:12:36.000Z' })
  timestamp: Date;

  @ApiPropertyOptional({ example: 'Paris, France', nullable: true })
  locationName: string | null;
}
