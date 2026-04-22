import { BadRequestException, Injectable } from "@nestjs/common";
import { UsersMapper } from "./users.mapper";
import { UsersRepository } from "./users.repository";
import { GetUserType } from "./users.entity";
import { Profile } from "passport-google-oauth20";

@Injectable()
export class UsersService {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly usersMapper: UsersMapper,
	) {}

	getUserById(id: number | string) {
		const intId = typeof id === "string" ? parseInt(id, 10) : id;
		if (isNaN(intId)) {
			throw new BadRequestException("Invalid user ID");
		}
		return this.usersRepository.findById(intId);
	}
   upsertUserFromGoogle(profile : Profile){
     const userToCreate = this.usersMapper.toCreateUserFromGoogleProfile(profile)
    return  this.usersRepository.upsertGoogleUser(userToCreate)
   }
    
	getUserByGoogleId(id: string) {
		return this.usersRepository.findByGoogleId(id);
	}

	// getUsersPaginated = (userPaginatedQuery: UserPaginatedQueryDto) =>
	//   this.usersRepository
	//     .findPaginated(userPaginatedQuery)
	//     .then(x => this.usersMapper.toGetUsersPaginatedDto(userPaginatedQuery, x.results, x.totalCount));

	getUser(user: GetUserType) {
		return this.usersMapper.toGetUserDto(user);
	}
	//
	// deleteUser = (user: UserDocument) => this.usersRepository.deleteUser(user);
}
