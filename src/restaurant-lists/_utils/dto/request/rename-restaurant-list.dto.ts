import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RenameRestaurantListDto {
  @ApiProperty({
    example: 'Favorites in Paris',
    description: 'New name for the list',
    maxLength: 80,
  })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}
