import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InstagramCallbackDto {
  @ApiProperty({ description: 'OAuth2 code from Instagram' })
  @IsString()
  code: string;
}
