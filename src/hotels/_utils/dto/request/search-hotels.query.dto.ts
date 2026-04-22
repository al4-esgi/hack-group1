import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';
import { Optional } from 'class-validator-extended';
import { PaginatedQueryDto, SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { toIdArray } from 'src/_utils/transforms/to-id-array.transform';

export enum HotelSearchSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export class SearchHotelsQueryDto extends PaginatedQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Number of items per page',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @Optional()
  pageSize = 20;

  @ApiPropertyOptional({ description: 'Text search on hotel name and content.' })
  @IsString()
  @Optional()
  search?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, description: 'Filter by country id (exact).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Optional()
  countryId?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, description: 'Filter by city id (exact).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Optional()
  cityId?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'integer' },
    description: 'Amenity ids (any match), comma-separated or repeated.',
  })
  @Transform(toIdArray)
  @IsArray()
  @IsInt({ each: true })
  @Optional()
  amenityIds?: number[];

  @ApiPropertyOptional({ description: 'Filter sustainable hotels only.' })
  @IsBoolean()
  @Optional()
  sustainableHotel?: boolean;

  @ApiPropertyOptional({ description: 'Filter bookable hotels only.' })
  @IsBoolean()
  @Optional()
  bookable?: boolean;

  @ApiPropertyOptional({ description: 'Filter Michelin Plus hotels only.' })
  @IsBoolean()
  @Optional()
  isPlus?: boolean;

  @ApiPropertyOptional({ description: 'Filter by distinction code (e.g. "1_KEY", "2_KEY", "3_KEY").' })
  @IsString()
  @Optional()
  distinction?: string;

  @ApiPropertyOptional({ enum: HotelSearchSortBy, default: HotelSearchSortBy.NAME, description: 'Sort key.' })
  @Optional()
  sortBy: HotelSearchSortBy = HotelSearchSortBy.NAME;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.ASC })
  @Optional()
  sortDirection: SortDirection = SortDirection.ASC;
}
