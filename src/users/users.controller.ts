import { Controller, Delete, Get, HttpCode, Param, Query } from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Protect } from '../auth/_utils/decorator/protect.decorator';
import { UserByIdPipe } from './_utils/user-by-id.pipe';
import { UserRoleEnum } from './_utils/user-role.enum';
import { ConnectedUser } from './_utils/decorator/connecter-user.decorator';
import { UserPaginatedQueryDto } from './_utils/dto/request/user-paginated-query.dto';
import { GetUserType } from './users.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Protect(UserRoleEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: "Get the current user's information." })
  getUsersPaginated(@Query() userPaginatedQuery: UserPaginatedQueryDto) {
    // return this.usersService.getUsersPaginated(userPaginatedQuery);
  }

  @Protect()
  @Get('me')
  @ApiOperation({ summary: "Get the current user's information." })
  getCurrentUser(@ConnectedUser() user: GetUserType) {
    return this.usersService.getUser(user);
  }

  @Protect(UserRoleEnum.ADMIN)
  @Get(':userId')
  @ApiParam({ type: 'string', name: 'userId' })
  @ApiOperation({ summary: "Get a user's information by its ID." })
  getUserById(@Param('userId', UserByIdPipe) user: GetUserType) {
    // return this.usersService.getUser(user);
  }

  @Protect(UserRoleEnum.ADMIN)
  @Delete(':userId')
  @HttpCode(204)
  @ApiParam({ type: 'string', name: 'userId' })
  @ApiOperation({ summary: "Delete a user's account by its ID." })
  @ApiNoContentResponse({ description: 'User deleted.' })
  deleteUser(@Param('userId') user:  GetUserType) {
    // return this.usersService.deleteUser(user);
  }
}
