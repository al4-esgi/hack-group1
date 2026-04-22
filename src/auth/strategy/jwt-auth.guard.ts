import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { UserRoleEnum, UserRoleEnumType } from '../../users/_utils/user-role.enum';
import {  GetUserType } from '../../users/users.entity';
import { ROLES_KEY } from '../_utils/decorator/protect.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isActivated = await super.canActivate(context);
    if (!isActivated) return false;

    const roles = this.reflector.get<UserRoleEnumType[]>(ROLES_KEY, context.getHandler());
    if (!roles || !roles.length) return true;

    const request = context.switchToHttp().getRequest();
    const user: GetUserType = request.user;

    if (!user) return false;
    return roles.includes(user.role);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (info && info.message === 'jwt expired') throw new ForbiddenException('TOKEN_EXPIRED');
    return super.handleRequest(err, user, info, context);
  }
}
