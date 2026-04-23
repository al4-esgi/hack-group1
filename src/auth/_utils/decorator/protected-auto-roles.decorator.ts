import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { merge } from 'lodash';
import { UserRoleEnumType } from 'src/users/_utils/user-role.enum';

export function ProtectedAutoRolesDecorator(...roles: UserRoleEnumType[]) {
  return (_target: any, _key: any, descriptor: any) => {
    if (!descriptor?.value) {
      return;
    }

    const current = merge({ summary: '' }, Reflect.getMetadata(DECORATORS.API_OPERATION, descriptor.value));
    current.summary += ` (${roles.join(', ') || 'ALL'})`;
    Reflect.defineMetadata(DECORATORS.API_OPERATION, current, descriptor.value);
  };
}
