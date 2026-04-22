import { Injectable } from '@nestjs/common';
import { GetUserType } from './users.entity';
import { GetUserDto } from './_utils/dto/response/get-user.dto';

@Injectable()
export class UsersMapper {
  toGetUserDto = (user: GetUserType): GetUserDto => ({
    id: user.id.toString(),
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  });

  //
  // toGetUserLightDto = (user: SelectUser): GetUserLightDto => ({
  //   id: user.id.toString(),
  //   email: user.email,
  //   firstname: user.firstname,
  //   lastname: user.lastname,
  // });
  //
  // toGetUsersPaginatedDto = (paginatedQuery: PaginatedQueryDto, users: UserDocument[], totalCount: number) =>
  //   new GetUsersPaginatedDto(users.map(this.toGetUserLightDto), paginatedQuery, totalCount);
}
