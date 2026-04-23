import { ApiProperty } from '@nestjs/swagger';
import { RestaurantListItemDto } from './restaurant-list-item.dto';

export class RestaurantListContentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'liked' })
  name: string;

  @ApiProperty({ type: [RestaurantListItemDto] })
  items: RestaurantListItemDto[];
}
