import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Optional } from 'class-validator-extended';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginatedQueryDto {
  @ApiPropertyOptional({ type: 'integer', minimum: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Items per page',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({ description: 'Field name to sort by (use-case specific).' })
  @IsString()
  @Optional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsEnum(SortDirection)
  @Optional()
  sortDirection: SortDirection = SortDirection.DESC;

  get skip() {
    return (this.page - 1) * this.pageSize;
  }

  get limit() {
    return this.pageSize;
  }
}
