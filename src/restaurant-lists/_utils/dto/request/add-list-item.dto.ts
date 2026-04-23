import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AddListItemDto {
  @ApiProperty({
    example: 'hotel',
    description: 'Type of item to add (e.g. restaurant, hotel, bistro, other)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  itemType: string;

  @ApiProperty({
    example: 42,
    description: 'Identifier of the item in its source catalog',
  })
  @IsInt()
  @Min(1)
  itemId: number;

  @ApiPropertyOptional({
    example: 'Petit bistrot de quartier',
    description: 'Optional display name. Required for custom types not managed by the backend',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;
}
