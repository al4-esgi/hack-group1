import { Injectable } from "@nestjs/common";
import { UsersMapper } from "./users.mapper";
import { UsersRepository } from "./users.repository";
import { UserPaginatedQueryDto } from "./_utils/dto/request/user-paginated-query.dto";
import { GetUserType } from "./users.entity";

@Injectable()
export class UsersService {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly usersMapper: UsersMapper,
	) {}

	getUserById(id: number | string) {
		const intId = typeof id === "string" ? parseInt(id, 10) : id;
		return this.usersRepository.findById(intId);
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
