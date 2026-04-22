import { ApiProperty } from '@nestjs/swagger';

export class HotelDetailsDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Hotel du Palais' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: '1 Avenue de l\'Impératrice, Biarritz' })
  address: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'A magnificent hotel on the Atlantic coast…' })
  content: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'https://guide.michelin.com/…' })
  canonicalUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'https://cdn.michelin.com/image.jpg' })
  mainImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, example: '43.480000' })
  lat: string | null;

  @ApiProperty({ type: String, nullable: true, example: '-1.558000' })
  lng: string | null;

  @ApiProperty({ type: String, nullable: true, example: '+33 5 59 41 64 00' })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, example: '64200' })
  postalCode: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Grande Plage' })
  neighborhood: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ example: 123 })
  cityId: number;

  @ApiProperty({ example: 'Biarritz' })
  city: string;

  @ApiProperty({ example: 45 })
  countryId: number;

  @ApiProperty({ example: 'France' })
  country: string;

  @ApiProperty({ type: String, nullable: true, example: '2_KEY', description: 'Michelin distinction code.' })
  distinctions: string | null;

  @ApiProperty({ example: false })
  isPlus: boolean;

  @ApiProperty({ example: false })
  sustainableHotel: boolean;

  @ApiProperty({ example: true })
  bookable: boolean;

  @ApiProperty({ type: Number, nullable: true, example: 14 })
  numRooms: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 4.5, description: 'Check-in time as decimal (14.0 = 14:00).' })
  checkInTime: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 12.0, description: 'Check-out time as decimal.' })
  checkOutTime: number | null;

  @ApiProperty({ type: [String], nullable: true, example: ['French', 'English'] })
  languages: string[] | null;

  @ApiProperty({ type: [String], example: ['Swimming pool', 'Spa'] })
  amenities: string[];
}
