import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { exit } from 'process';
import { DatabaseService } from 'src/database/database.service';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly restaurantImportService: RestaurantImportService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Running startup bootstrap tasks...');
    try {
      const csvPath = `${process.cwd()}/michelin_my_maps.csv`;
      const sourceName = csvPath.split('/').pop() ?? 'michelin_my_maps.csv';
      const sourceHash = await this.restaurantImportService.getFileHash(csvPath);
      const alreadyDone = await this.restaurantImportService.hasSuccessfulImport(sourceName, sourceHash);
      if (alreadyDone) {
        this.logger.log('Restaurant import skipped: same file hash already imported successfully.');
      } else {
        this.logger.log('Launching restaurant bootstrap import...');
        await this.restaurantImportService.runImport(csvPath, { strictCuisine: false });
      }

      await this.backfillGeoLocations();
      this.logger.log('Startup bootstrap tasks completed.');
    } catch (error) {
      const fatalMessage = this.getFatalStartupMessage(error);
      if (fatalMessage) {
        this.logger.error(fatalMessage);
        exit(1);
      }
      throw error;
    }
  }

  private async backfillGeoLocations(): Promise<void> {
    const db = this.databaseService.db;

    try {
      const hotelResult = await db.execute(sql`
        UPDATE hotels
        SET location = ST_SetSRID(ST_MakePoint(lng::float8, lat::float8), 4326)::geography
        WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
      `);
      const hotelCount = (hotelResult as unknown as { rowCount?: number })?.rowCount ?? 0;

      const restaurantResult = await db.execute(sql`
        UPDATE restaurants
        SET location = ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)::geography
        WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
      `);
      const restaurantCount = (restaurantResult as unknown as { rowCount?: number })?.rowCount ?? 0;

      if (hotelCount || restaurantCount) {
        this.logger.log(`Geo backfill: ${hotelCount} hotels, ${restaurantCount} restaurants updated.`);
      }
    } catch {
      this.logger.warn('Geo backfill skipped (location column may not exist yet — run db:push).');
    }
  }

  /** Maps well-known startup failures (DB unreachable / bad creds / missing schema) to a friendly message. */
  private getFatalStartupMessage(error: unknown): string | null {
    const err = error as { cause?: { code?: string }; code?: string; message?: string };
    const code = err?.cause?.code ?? err?.code;

    if (code === '42P01' || err?.message?.includes('relation "ingestion_logs" does not exist') === true) {
      return 'Database tables are missing. Run `pnpm run db:push` then restart the app.';
    }
    if (code === '28P01' || code === '28000') {
      return 'Database authentication failed. Check POSTGRES_USER / POSTGRES_PASSWORD in your .env.';
    }
    if (code === '3D000') {
      return 'Database does not exist. Check POSTGRES_DB in your .env or create the database.';
    }
    if (code === 'ECONNREFUSED') {
      return 'Cannot connect to the database. Is it running? (try `docker compose up -d`)';
    }
    return null;
  }
}
