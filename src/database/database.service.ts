import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Schema } from './database.schema';
import { DATABASE_CLIENT_TOKEN } from './database.providers';

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_CLIENT_TOKEN) readonly db: NodePgDatabase<Schema>) {}
}
