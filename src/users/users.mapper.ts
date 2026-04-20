import { GetUserDto } from './_utils/dto/response/get-user.dto';
import { UserDocument } from './users.schema';
import { Injectable } from '@nestjs/common';
import { PaginatedQueryDto } from '../_utils/dto/requests/paginated-query.dto';
import { GetUserLightDto } from './_utils/dto/response/get-user-light.dto';
import { GetUsersPaginatedDto } from './_utils/dto/response/get-users-paginated.dto';

@Injectable()
export class UsersMapper {
  toGetUserDto = (user: UserDocument): GetUserDto => ({
    id: user._id.toString(),
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
  });

  toGetUserLightDto = (user: UserDocument): GetUserLightDto => ({
    id: user._id.toString(),
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  });

  toGetUsersPaginatedDto = (paginatedQuery: PaginatedQueryDto, users: UserDocument[], totalCount: number) =>
    new GetUsersPaginatedDto(users.map(this.toGetUserLightDto), paginatedQuery, totalCount);
}
