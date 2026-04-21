import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../users.repository';
import { user } from '../users.entity';

@Injectable()
export class UserByIdPipe implements PipeTransform<string,{name:string}> {
  constructor(private usersRepository: UsersRepository) {}

  transform(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('INVALID_USER_ID');
    return  {name: "hello"}
  }
}
