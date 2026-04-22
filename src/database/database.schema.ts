import { user } from 'src/users/users.entity';
export const schema = { user };
export type Schema = typeof schema;
export type SchemaName = keyof Schema;

export type { GetUserType } from 'src/users/users.entity'
