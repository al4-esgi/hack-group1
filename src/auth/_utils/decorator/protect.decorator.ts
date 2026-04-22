import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ProtectedAutoRolesDecorator } from './protected-auto-roles.decorator';
import { JwtAuthGuard } from '../../strategy/jwt-auth.guard';
import { UserRoleEnum, UserRoleEnumType } from 'src/users/_utils/user-role.enum';

export const ROLES_KEY = 'roles';

export function Protect(...roles: UserRoleEnumType[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ProtectedAutoRolesDecorator(...roles),
  );
}
