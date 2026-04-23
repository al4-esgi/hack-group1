import { ApiProperty } from '@nestjs/swagger';

export class RestaurantListDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'liked' })
  name: string;

  @ApiProperty({ example: 12 })
  itemsCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
