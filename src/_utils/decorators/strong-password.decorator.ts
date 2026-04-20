import { applyDecorators } from '@nestjs/common';
import { IsStrongPassword, IsStrongPasswordOptions } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const isStrongPasswordOptions: IsStrongPasswordOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

const strongPasswordMessage =
  'The password must contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol.';

export default function () {
  return applyDecorators(
    ApiProperty({ example: 'Test1234**' }),
    IsStrongPassword(isStrongPasswordOptions, { message: strongPasswordMessage }),
  );
}
