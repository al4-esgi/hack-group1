export const UserRoleEnum =  {
  ADMIN : 'ADMIN',
  USER : 'USER',
} as const

export type UserRoleEnumType = (typeof UserRoleEnum)[ keyof typeof UserRoleEnum]

