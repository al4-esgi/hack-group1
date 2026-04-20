import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import StrongPasswordDecorator from '../../../../_utils/decorators/strong-password.decorator';

export class LoginDto {
  @ApiProperty({ example: 'atiteux@dev-id.fr' })
  @IsEmail()
  email: string;

  @StrongPasswordDecorator()
  password: string;
}
