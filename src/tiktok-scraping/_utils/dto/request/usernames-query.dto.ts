import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UsernamesQueryDto {
  @ApiProperty({
    description:
      "Comma-separated TikTok usernames to scrape (with or without @)",
    example: "onigiri.spicy,@beli_eats",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }: { value: string }) =>
    value
      .split(",")
      .map((username) => username.trim().replace(/^@/, ""))
      .filter((username) => username.length > 0),
  )
  usernames: string[];

  @ApiProperty({
    description: "Maximum number of posts to retrieve per username",
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
    description: "Filter posts by exact city name (case-insensitive)",
    example: "Paris",
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description:
      "Filter posts whose address contains this substring (case-insensitive). Useful for arrondissements or street names.",
    example: "75015",
  })
  @IsOptional()
  @IsString()
  addressContains?: string;

  @ApiPropertyOptional({
    description:
      "If true, exclude posts with no location (locationName is null)",
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === "true")
  @IsBoolean()
  locationRequired?: boolean;
}
