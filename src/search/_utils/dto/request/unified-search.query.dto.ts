import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsString, Max, Min, ValidateIf } from 'class-validator';
import { Optional } from 'class-validator-extended';
import { PaginatedQueryDto, SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { toIdArray } from 'src/_utils/transforms/to-id-array.transform';

export enum SearchType {
  HOTEL = 'hotel',
  RESTAURANT = 'restaurant',
}

export enum UnifiedSearchSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  DISTANCE = 'distance',
}

const toSearchTypes = ({ value }: { value?: string | string[] }): SearchType[] => {
  if (!value) return [SearchType.HOTEL, SearchType.RESTAURANT];
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  const types = raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter((s): s is SearchType => Object.values(SearchType).includes(s as SearchType));
  return types.length ? [...new Set(types)] : [SearchType.HOTEL, SearchType.RESTAURANT];
};

export class UnifiedSearchQueryDto extends PaginatedQueryDto {
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

  // ─── Type selector ───

  @ApiPropertyOptional({
    description: 'Comma-separated types to include: hotel, restaurant (default: both).',
    example: 'hotel,restaurant',
  })
  @Transform(toSearchTypes)
  @IsArray()
  @IsEnum(SearchType, { each: true })
  @Optional()
  types: SearchType[] = [SearchType.HOTEL, SearchType.RESTAURANT];

  // ─── Shared filters ───

  @ApiPropertyOptional({ description: 'Text search on name and description/content.' })
  @IsString()
  @Optional()
  search?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, description: 'Filter by country id.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Optional()
  countryId?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, description: 'Filter by city id.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Optional()
  cityId?: number;

  // ─── Geo filters (all three required together) ───

  @ApiPropertyOptional({ type: 'number', description: 'Center latitude for radius search.' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @ValidateIf(o => o.lat !== undefined || o.lng !== undefined || o.radiusKm !== undefined)
  lat?: number;

  @ApiPropertyOptional({ type: 'number', description: 'Center longitude for radius search.' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @ValidateIf(o => o.lat !== undefined || o.lng !== undefined || o.radiusKm !== undefined)
  lng?: number;

  @ApiPropertyOptional({ type: 'number', minimum: 0.1, maximum: 200, default: 10, description: 'Search radius in km.' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(200)
  @ValidateIf(o => o.lat !== undefined || o.lng !== undefined || o.radiusKm !== undefined)
  radiusKm?: number;

  // ─── Hotel-only filters ───

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'integer' },
    description: 'Amenity ids (any match), comma-separated or repeated. Hotel-only.',
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

  @ApiPropertyOptional({ description: 'Filter by distinction code (e.g. "1_KEY", "2_KEY", "3_KEY"). Hotel-only.' })
  @IsString()
  @Optional()
  distinction?: string;

  // ─── Restaurant-only filters ───

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'integer' },
    description: 'Cuisine ids (any match), comma-separated or repeated. Restaurant-only.',
  })
  @Transform(toIdArray)
  @IsArray()
  @IsInt({ each: true })
  @Optional()
  cuisineIds?: number[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'integer' },
    description: 'Facility ids (any match), comma-separated or repeated. Restaurant-only.',
  })
  @Transform(toIdArray)
  @IsArray()
  @IsInt({ each: true })
  @Optional()
  facilityIds?: number[];

  @ApiPropertyOptional({ description: 'Main award code filter (MICHELIN_STAR, BIB_GOURMAND, SELECTED). Restaurant-only.', example: 'MICHELIN_STAR' })
  @IsString()
  @Optional()
  awardCode?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 3, description: 'Minimum Michelin stars. Restaurant-only.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  @Optional()
  minStars?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 3, description: 'Maximum Michelin stars. Restaurant-only.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  @Optional()
  maxStars?: number;

  @ApiPropertyOptional({ description: 'Filter restaurants with green star. Restaurant-only.' })
  @IsBoolean()
  @Optional()
  greenStar?: boolean;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 4, description: 'Minimum price level (1-4). Restaurant-only.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @Optional()
  minPriceLevel?: number;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 4, description: 'Maximum price level (1-4). Restaurant-only.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  @Optional()
  maxPriceLevel?: number;

  // ─── Sort ───

  @ApiPropertyOptional({ enum: UnifiedSearchSortBy, default: UnifiedSearchSortBy.NAME, description: 'Sort key. `distance` requires lat/lng.' })
  @IsEnum(UnifiedSearchSortBy)
  @Optional()
  sortBy: UnifiedSearchSortBy = UnifiedSearchSortBy.NAME;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.ASC })
  @IsEnum(SortDirection)
  @Optional()
  sortDirection: SortDirection = SortDirection.ASC;

  // ─── Helpers ───

  get hasGeo(): boolean {
    return this.lat !== undefined && this.lng !== undefined;
  }

  get radiusMeters(): number {
    return (this.radiusKm ?? 10) * 1000;
  }

  get includesHotels(): boolean {
    return this.types.includes(SearchType.HOTEL);
  }

  get includesRestaurants(): boolean {
    return this.types.includes(SearchType.RESTAURANT);
  }
}
