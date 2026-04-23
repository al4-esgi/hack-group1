import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class HashtagsQueryDto {
  @ApiProperty({
    description: 'Comma-separated hashtags to scrape (with or without #)',
    example: 'foodieparis,#bistrotparis',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }: { value: string }) =>
    value
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter((tag) => tag.length > 0),
  )
  tags: string[];

  @ApiProperty({
    description: 'Maximum number of posts to retrieve per hashtag',
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
