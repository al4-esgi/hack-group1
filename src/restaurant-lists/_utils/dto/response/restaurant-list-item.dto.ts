import { ApiProperty } from '@nestjs/swagger';

export class RestaurantListItemDto {
  @ApiProperty({ example: 'hotel' })
  itemType: string;

  @ApiProperty({ example: 42 })
  itemId: number;

  @ApiProperty({ example: 'Le Jules Verne' })
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  addedAt: Date;
}
