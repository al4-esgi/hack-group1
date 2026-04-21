import { GetUserDto } from './_utils/dto/response/get-user.dto';
import { SelectUser  } from './users.entity';
import { Injectable } from '@nestjs/common';
import { PaginatedQueryDto } from '../_utils/dto/requests/paginated-query.dto';
import { GetUserLightDto } from './_utils/dto/response/get-user-light.dto';
import { GetUsersPaginatedDto } from './_utils/dto/response/get-users-paginated.dto';

@Injectable()
export class UsersMapper {
  // toGetUserDto = (user: SelectUser): GetUserDto => ({
  //   id: user.id.toString(),
  //   email: user.email,
  //   firstname: user.firstname,
  //   lastname: user.lastname,
  // });
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
