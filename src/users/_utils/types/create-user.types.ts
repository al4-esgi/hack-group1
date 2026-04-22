import { UserRoleEnumType } from "../user-role.enum"

export class CreateUser {
  email: string
  firstname: string
  lastname: string
  googleId: string
  role?: UserRoleEnumType
  photoUrl: string | null
}
