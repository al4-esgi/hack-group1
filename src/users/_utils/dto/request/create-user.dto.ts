import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import StrongPasswordDecorator from '../../../../_utils/decorators/strong-password.decorator';
import { UserRoleEnum } from '../../user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'atiteux@dev-id.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Test1234**' })
  @StrongPasswordDecorator()
  password: string;

  @ApiProperty()
  @IsString()
  firstname: string;

  @ApiProperty()
  @IsString()
  lastname: string;

  @ApiProperty()
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}
