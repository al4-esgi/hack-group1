import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { Optional } from 'class-validator-extended';

export class AutocompleteQueryDto {
  @ApiPropertyOptional({ description: 'Filter by substring (case-insensitive).', example: 'Fra' })
  @IsString()
  @MaxLength(100)
  @Optional()
  q?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 50, default: 20, description: 'Max suggestions' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @Optional()
  limit = 20;
}

export class CityAutocompleteQueryDto extends AutocompleteQueryDto {
  @ApiPropertyOptional({ type: 'integer', minimum: 1, description: 'Only cities in this country (id).' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Optional()
  countryId?: number;
}
