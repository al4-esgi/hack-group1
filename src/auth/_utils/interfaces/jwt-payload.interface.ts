import { UserRoleEnum, UserRoleEnumType } from '../../../users/_utils/user-role.enum';

export default interface JwtPayloadInterface {
  id: string;
  role: UserRoleEnumType;
  email: string;
}
