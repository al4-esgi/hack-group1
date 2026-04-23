import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UsernamesQueryDto {
  @ApiProperty({
    description: 'Comma-separated Instagram usernames to scrape (with or without @)',
    example: 'onigiri.spicy,@beli_eats',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }: { value: string }) =>
    value
      .split(',')
      .map((username) => username.trim().replace(/^@/, ''))
      .filter((username) => username.length > 0),
  )
  usernames: string[];

  @ApiProperty({
    description: 'Maximum number of posts to retrieve per username',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'If true, exclude posts without location (locationName is null)',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  locationRequired?: boolean;
}
