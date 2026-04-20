import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../users.repository';
import { UserDocument } from '../users.schema';

@Injectable()
export class UserByIdPipe implements PipeTransform<string, Promise<UserDocument>> {
  constructor(private usersRepository: UsersRepository) {}

  transform(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('INVALID_USER_ID');
    return this.usersRepository.findOneByIdOrThrow(userId);
  }
}
