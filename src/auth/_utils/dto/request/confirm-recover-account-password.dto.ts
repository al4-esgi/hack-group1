import { IsString } from 'class-validator';
import StrongPasswordDecorator from '../../../../_utils/decorators/strong-password.decorator';

export class ConfirmRecoverAccountPasswordDto {
  @IsString()
  token: string;

  @StrongPasswordDecorator()
  password: string;
}
