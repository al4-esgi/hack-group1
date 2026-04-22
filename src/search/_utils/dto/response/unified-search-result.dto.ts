import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/_utils/dto/responses/pagination-meta.dto';

export class UnifiedHotelItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Hotel du Palais' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  address: string | null;

  @ApiProperty({ type: String, nullable: true })
  content: string | null;

  @ApiProperty({ type: String, nullable: true })
  mainImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: '43.480000' })
  lat: string | null;

  @ApiProperty({ type: String, nullable: true, example: '-1.558000' })
  lng: string | null;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'Biarritz' })
  city: string;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, nullable: true, example: '2_KEY' })
  distinctions: string | null;

  @ApiProperty({ example: false })
  isPlus: boolean;

  @ApiProperty({ example: false })
  sustainableHotel: boolean;

  @ApiProperty({ example: true })
  bookable: boolean;

  @ApiProperty({ type: [String], example: ['Swimming pool', 'Spa'] })
  amenities: string[];

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'Distance in meters from search center.' })
  distanceMeters?: number | null;
}

export class UnifiedRestaurantItemDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Le Jules Verne' })
  name: string;

  @ApiProperty({ example: 'Avenue Gustave Eiffel, 75007 Paris' })
  address: string;

  @ApiProperty({ example: 'Gastronomic restaurant...' })
  description: string;

  @ApiProperty({ example: 'https://guide.michelin.com/...' })
  sourceUrl: string;

  @ApiProperty({ type: String, nullable: true })
  websiteUrl: string | null;

  @ApiProperty({ example: '48.858237' })
  latitude: string;

  @ApiProperty({ example: '2.294481' })
  longitude: string;

  @ApiProperty({ type: String, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'Paris' })
  city: string;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, nullable: true, example: 'MICHELIN_STAR' })
  awardCode: string | null;

  @ApiProperty({ type: Number, nullable: true, minimum: 1, maximum: 3 })
  stars: number | null;

  @ApiProperty({ example: false })
  hasGreenStar: boolean;

  @ApiProperty({ type: [String], example: ['French', 'Seafood'] })
  cuisines: string[];

  @ApiProperty({ type: [String], example: ['Air conditioning', 'Car park'] })
  facilities: string[];

  @ApiProperty({ type: Number, nullable: true, minimum: 1, maximum: 4 })
  priceLevel: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, description: 'Distance in meters from search center.' })
  distanceMeters?: number | null;
}

export class UnifiedSearchResultDto {
  @ApiProperty({ type: [UnifiedHotelItemDto] })
  hotels: UnifiedHotelItemDto[];

  @ApiProperty({ type: [UnifiedRestaurantItemDto] })
  restaurants: UnifiedRestaurantItemDto[];

  @ApiProperty()
  meta: PaginationMetaDto;
}
