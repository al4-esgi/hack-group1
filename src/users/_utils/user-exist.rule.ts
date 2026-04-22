import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersRepository } from '../users.repository';
import { Injectable } from '@nestjs/common';
import {  UserRoleEnumType } from './user-role.enum';

@ValidatorConstraint({ name: 'UserExists', async: true })
@Injectable()
export class UserExistsRule implements ValidatorConstraintInterface {
  constructor(private usersRepository: UsersRepository) {}

  async validate(id: string, args: ValidationArguments) {
    const intId = parseInt(id)
    const user = await this.usersRepository.findById(intId);
    return !!user && ((args.constraints && args.constraints?.includes(user.role)) ?? true);
  }

  defaultMessage = (args: ValidationArguments) => `${args.property} didn't find user`;
}

export function UserExists(roles?: UserRoleEnumType[], validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'UserExists',
      target: object.constructor,
      propertyName: propertyName,
      constraints: roles,
      options: validationOptions,
      validator: UserExistsRule,
    });
  };
}
