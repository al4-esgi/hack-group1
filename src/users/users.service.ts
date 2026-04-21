import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './_utils/dto/request/create-user.dto';
import { UsersMapper } from './users.mapper';
import { UsersRepository } from './users.repository';
import { UserPaginatedQueryDto } from './_utils/dto/request/user-paginated-query.dto';
import { SelectUser } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersMapper: UsersMapper,
  ) {}

  createUser = (createUserDto: CreateUserDto) =>
    this.usersRepository.createUser(createUserDto)//.then(this.usersMapper.toGetUserDto);
  //
  // getUsersPaginated = (userPaginatedQuery: UserPaginatedQueryDto) =>
  //   this.usersRepository
  //     .findPaginated(userPaginatedQuery)
  //     .then(x => this.usersMapper.toGetUsersPaginatedDto(userPaginatedQuery, x.results, x.totalCount));

  // getUser(user: SelectUser) {
  //   return this.usersMapper.toGetUserDto(user);
  // }
  //
  // deleteUser = (user: UserDocument) => this.usersRepository.deleteUser(user);
}
