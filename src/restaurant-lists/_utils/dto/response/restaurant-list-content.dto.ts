import { ApiProperty } from '@nestjs/swagger';
import { RestaurantListRestaurantDto } from './restaurant-list-restaurant.dto';

export class RestaurantListContentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'liked' })
  name: string;

  @ApiProperty({ type: [RestaurantListRestaurantDto] })
  restaurants: RestaurantListRestaurantDto[];
}
