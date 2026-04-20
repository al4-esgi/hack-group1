import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RecoverAccountPasswordDto {
  @ApiProperty({ example: 'atiteux@dev-id.fr' })
  @IsEmail()
  email: string;
}
