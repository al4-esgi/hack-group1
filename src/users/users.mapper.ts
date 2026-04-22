import { Injectable } from '@nestjs/common';
import { GetUserType } from './users.entity';
import { GetUserDto } from './_utils/dto/response/get-user.dto';
import { Profile } from 'passport-google-oauth20';
import { CreateUser } from './_utils/types/create-user.types';

@Injectable()
export class UsersMapper {
  toGetUserDto = (user: GetUserType): GetUserDto => ({
    id: user.id.toString(),
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    photoUrl: user.photo_url
  });

  toCreateUserFromGoogleProfile = (profile: Profile): CreateUser => ({
      googleId: profile.id,
			email: profile.emails?.[0]?.value || "",
			firstname: profile.name?.givenName || "",
			lastname: profile.name?.familyName || "",
			photoUrl: profile.photos?.[0]?.value || null,
  })
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
