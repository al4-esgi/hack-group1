import { ApiProperty } from '@nestjs/swagger';

export class RestaurantDetailsDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Le Jules Verne' })
  name: string;

  @ApiProperty({ example: 'Avenue Gustave Eiffel, 75007 Paris' })
  address: string;

  @ApiProperty({ example: 'Gastronomic restaurant at the top of the Eiffel Tower…' })
  description: string;

  @ApiProperty({ example: 'https://guide.michelin.com/en/ile-de-france/paris/restaurant/le-jules-verne' })
  sourceUrl: string;

  @ApiProperty({ type: String, nullable: true, example: 'https://www.lejulesverne-paris.com/' })
  websiteUrl: string | null;

  @ApiProperty({ example: '48.858237' })
  latitude: string;

  @ApiProperty({ example: '2.294481' })
  longitude: string;

  @ApiProperty({ type: String, nullable: true, example: '+33 1 45 55 61 44' })
  phoneNumber: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: 123 })
  cityId: number;

  @ApiProperty({ example: 'Paris' })
  city: string;

  @ApiProperty({ example: 45 })
  countryId: number;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'MICHELIN_STAR',
    description: 'Main distinction code; GREEN_STAR is only reflected here as the primary award when no other exists.',
  })
  awardCode: string | null;

  @ApiProperty({ type: Number, nullable: true, minimum: 1, maximum: 3, example: 2 })
  stars: number | null;

  @ApiProperty({ example: false })
  hasGreenStar: boolean;

  @ApiProperty({ type: [String], example: ['French', 'Seafood'] })
  cuisines: string[];

  @ApiProperty({ type: [String], example: ['Air conditioning', 'Car park'] })
  facilities: string[];

  @ApiProperty({ type: Number, nullable: true, minimum: 1, maximum: 4, example: 4 })
  priceLevel: number | null;
}
