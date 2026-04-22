import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import { Optional } from 'class-validator-extended';
import { PaginatedQueryDto, SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';

export enum RestaurantSearchSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  STARS = 'stars',
}

const toIdArray = ({ value }: { value?: string | string[] }): number[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const source = Array.isArray(value) ? value.join(',') : String(value);
  const ids = source
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => parseInt(s, 10))
    .filter(n => Number.isFinite(n));
  return ids.length ? ids : undefined;
};

export class SearchRestaurantsQueryDto extends PaginatedQueryDto {
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
  @ApiPropertyOptional({ description: 'Text search on restaurant name and description.' })
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

  @ApiPropertyOptional({ type: 'array', items: { type: 'integer' }, description: 'Cuisine ids (any match), comma-separated or repeated.' })
  @Transform(toIdArray)
  @IsArray()
  @IsInt({ each: true })
  @Optional()
  cuisineIds?: number[];

  @ApiPropertyOptional({ type: 'array', items: { type: 'integer' }, description: 'Facility ids (any match), comma-separated or repeated.' })
  @Transform(toIdArray)
  @IsArray()
  @IsInt({ each: true })
  @Optional()
  facilityIds?: number[];

  @ApiPropertyOptional({
    description:
      'Main award code filter (MICHELIN_STAR, BIB_GOURMAND, SELECTED). Use `greenStar` to filter on the green star add-on.',
    example: 'MICHELIN_STAR',
  })
  @IsString()
  @Optional()
  awardCode?: string;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 3,
    description:
      'Minimum Michelin stars. Implicitly restricts to MICHELIN_STAR awards when `awardCode` is not set.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  @Optional()
  minStars?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 3,
    description:
      'Maximum Michelin stars. Implicitly restricts to MICHELIN_STAR awards when `awardCode` is not set.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  @Optional()
  maxStars?: number;

  @ApiPropertyOptional({ description: 'Filter restaurants with green star.' })
  @IsBoolean()
  @Optional()
  greenStar?: boolean;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 4, description: 'Minimum price level (1–4).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @Optional()
  minPriceLevel?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 4, description: 'Maximum price level (1–4).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @Optional()
  maxPriceLevel?: number;

  @ApiPropertyOptional({ enum: RestaurantSearchSortBy, default: RestaurantSearchSortBy.NAME, description: 'Restaurants list sort key.' })
  @IsEnum(RestaurantSearchSortBy)
  @Optional()
  sortBy: RestaurantSearchSortBy = RestaurantSearchSortBy.NAME;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.ASC })
  @IsEnum(SortDirection)
  @Optional()
  sortDirection: SortDirection = SortDirection.ASC;
}
