import { ApiProperty } from '@nestjs/swagger';
import { PaginatedQueryDto } from 'src/_utils/dto/requests/paginated-query.dto';
import { PaginationDto } from 'src/_utils/dto/responses/pagination.dto';
import { HotelSearchItemDto } from './hotel-search-item.dto';

export class GetHotelsPaginatedDto extends PaginationDto {
  @ApiProperty({ type: [HotelSearchItemDto] })
  hotels: HotelSearchItemDto[];

  constructor(hotels: HotelSearchItemDto[], paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    super(paginatedQuery, totalItemsCount);
    this.hotels = hotels;
  }
}
