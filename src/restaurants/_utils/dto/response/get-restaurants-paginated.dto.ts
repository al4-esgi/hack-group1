import { ApiProperty } from '@nestjs/swagger';
import { PaginatedQueryDto } from 'src/_utils/dto/requests/paginated-query.dto';
import { PaginationDto } from 'src/_utils/dto/responses/pagination.dto';
import { RestaurantSearchItemDto } from './restaurant-search-item.dto';

export class GetRestaurantsPaginatedDto extends PaginationDto {
  @ApiProperty({ type: [RestaurantSearchItemDto] })
  restaurants: RestaurantSearchItemDto[];

  constructor(restaurants: RestaurantSearchItemDto[], paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    super(paginatedQuery, totalItemsCount);
    this.restaurants = restaurants;
  }
}
