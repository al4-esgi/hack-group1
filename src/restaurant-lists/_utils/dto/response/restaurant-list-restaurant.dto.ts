import { ApiProperty } from '@nestjs/swagger';

export class RestaurantListRestaurantDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Le Jules Verne' })
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  addedAt: Date;
}
