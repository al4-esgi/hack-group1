import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersRepository } from '../users.repository';
import { Injectable } from '@nestjs/common';
import { UserRoleEnum } from './user-role.enum';
import { Types } from 'mongoose';

@ValidatorConstraint({ name: 'UserExists', async: true })
@Injectable()
export class UserExistsRule implements ValidatorConstraintInterface {
  constructor(private usersRepository: UsersRepository) {}

  async validate(id: string, args: ValidationArguments) {
    if (!Types.ObjectId.isValid(id)) return false;
    const user = await this.usersRepository.findOneById(id);
    return !!user && ((args.constraints && args.constraints?.includes(user.role)) ?? true);
  }

  defaultMessage = (args: ValidationArguments) => `${args.property} didn't find user`;
}

export function UserExists(roles?: UserRoleEnum[], validationOptions?: ValidationOptions) {
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
