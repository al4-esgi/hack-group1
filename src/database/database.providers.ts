import { Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Schema, schema } from './database.schema';
import { ConfigService } from '@nestjs/config';

export const DATABASE_CLIENT_TOKEN = 'DATABASE_CLIENT_TOKEN';

export const databaseProviders: Provider[] =  [{
  provide: DATABASE_CLIENT_TOKEN,
  inject: [ConfigService],
  useFactory(configService: ConfigService) {
    const pool = new Pool({ connectionString: configService.get("DATABASE_URL") });
    return drizzle(pool, { schema, logger: true }) as NodePgDatabase<Schema>;
  },
}]
