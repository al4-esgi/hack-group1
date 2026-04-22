import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import {
  awardTypes,
  cities,
  countries,
  cuisines,
  facilities,
  ingestionLogs,
  restaurantAwards,
  restaurantCuisines,
  restaurantFacilities,
  restaurants,
} from 'src/restaurants/entities';
import { AWARD_CODES, GREEN_STAR_CODE } from 'src/restaurants/_constants';
import { readCsvAsObjects } from './csv-reader';
import { mapRestaurantRow, type RestaurantRowMapped } from './restaurant-row.mapper';
import { normalizeKey, normalizeLabel } from './normalizers';

type ImportOptions = {
  strictCuisine: boolean;
};

type ImportStats = {
  rowsRead: number;
  restaurantsUpserted: number;
  unknownCuisines: number;
  skipped: number;
};

type PreparedRow = {
  mapped: RestaurantRowMapped;
  index: number;
};

@Injectable()
export class RestaurantImportService {
  private readonly logger = new Logger(RestaurantImportService.name);
  private readonly BATCH_SIZE = 500;
  private readonly MAX_WARNING_MESSAGES = 50;

  constructor(private readonly databaseService: DatabaseService) {}

  private countryCache = new Map<string, number>();
  private cityCache = new Map<string, number>();
  private cuisineCache = new Map<string, { id: number; name: string }>();
  private facilityCache = new Map<string, number>();
  private awardTypeCache = new Map<string, number>();

  getFileHash = async (filePath: string): Promise<string> => {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  };

  hasSuccessfulImport = async (sourceName: string, sourceHash: string): Promise<boolean> => {
    const latest = await this.databaseService.db
      .select()
      .from(ingestionLogs)
      .where(and(eq(ingestionLogs.sourceName, sourceName), eq(ingestionLogs.sourceHash, sourceHash)))
      .orderBy(desc(ingestionLogs.importedAt))
      .limit(1);

    return latest[0]?.status === 'SUCCESS';
  };

  runImport = async (csvPath: string, options: ImportOptions): Promise<ImportStats> => {
    const rows = await readCsvAsObjects(csvPath);
    const sourceName = csvPath.split('/').pop() ?? 'michelin_my_maps.csv';
    const sourceHash = await this.getFileHash(csvPath);

    const stats: ImportStats = {
      rowsRead: rows.length,
      restaurantsUpserted: 0,
      unknownCuisines: 0,
      skipped: 0,
    };
    const warnings: string[] = [];
    const pushWarning = (msg: string): void => {
      if (warnings.length < this.MAX_WARNING_MESSAGES) warnings.push(msg);
    };

    try {
      this.resetCaches();
      await this.preloadTaxonomyCaches();
      await this.seedOfficialCuisines();
      await this.seedStandardAwardTypes();

      const prepared: PreparedRow[] = [];
      rows.forEach((row, idx) => {
        try {
          const mapped = mapRestaurantRow(row);
          if (!mapped.name || !mapped.sourceUrl) {
            pushWarning(`Row ${idx + 2}: skipped (missing name or source url)`);
            stats.skipped += 1;
            return;
          }
          if (!mapped.location.country) {
            pushWarning(`Row ${idx + 2}: skipped (missing country in "${row.Location ?? ''}")`);
            stats.skipped += 1;
            return;
          }
          prepared.push({ mapped, index: idx });
        } catch (err) {
          pushWarning(`Row ${idx + 2}: ${err instanceof Error ? err.message : String(err)}`);
          stats.skipped += 1;
        }
      });

      await this.ensureCountriesBulk(prepared.map(p => p.mapped.location.country as string));
      await this.ensureCitiesBulk(
        prepared.map(p => ({ country: p.mapped.location.country as string, city: p.mapped.location.city })),
      );
      await this.ensureFacilitiesBulk(prepared.flatMap(p => p.mapped.facilities));

      const unknownCuisines = new Map<string, string>();
      prepared.forEach(({ mapped }) => {
        mapped.cuisines.forEach(cuisine => {
          const key = normalizeKey(cuisine);
          if (key && !this.cuisineCache.has(key)) unknownCuisines.set(key, cuisine);
        });
      });
      if (unknownCuisines.size > 0) {
        if (options.strictCuisine) {
          throw new Error(
            `Unknown cuisines encountered in strict mode: ${[...unknownCuisines.values()].join(', ')}`,
          );
        }
        await this.ensureCuisinesBulk([...unknownCuisines.values()]);
        stats.unknownCuisines = unknownCuisines.size;
        unknownCuisines.forEach(name => pushWarning(`Unknown cuisine auto-created: ${name}`));
      }

      for (let start = 0; start < prepared.length; start += this.BATCH_SIZE) {
        const batch = prepared.slice(start, start + this.BATCH_SIZE);
        try {
          const upsertedCount = await this.persistBatch(batch);
          stats.restaurantsUpserted += upsertedCount;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          stats.skipped += batch.length;
          pushWarning(`Batch starting row ${batch[0].index + 2} failed: ${message}`);
          this.logger.error(
            `Batch starting at row ${batch[0].index + 2} failed: ${message}`,
            err instanceof Error ? err.stack : undefined,
          );
        }
      }

      await this.databaseService.db.insert(ingestionLogs).values({
        sourceName,
        sourceHash,
        rowCount: stats.rowsRead,
        status: 'SUCCESS',
        message: warnings.length ? warnings.join(' | ') : null,
      });
      this.logger.log(
        `Import done. rows=${stats.rowsRead} upserted=${stats.restaurantsUpserted} skipped=${stats.skipped} unknownCuisines=${stats.unknownCuisines}`,
      );
      return stats;
    } catch (error) {
      await this.databaseService.db.insert(ingestionLogs).values({
        sourceName,
        sourceHash,
        rowCount: stats.rowsRead,
        status: 'FAILED',
        message: error instanceof Error ? error.message : 'Unknown import error',
      });
      throw error;
    }
  };

  private persistBatch = async (batch: PreparedRow[]): Promise<number> => {
    if (!batch.length) return 0;

    const unique = new Map<string, PreparedRow>();
    batch.forEach(row => unique.set(row.mapped.sourceUrl, row));
    const uniqueBatch = [...unique.values()];

    return this.databaseService.db.transaction(async tx => {
      const restaurantValues = uniqueBatch.map(({ mapped }) => {
        const countryKey = normalizeKey(mapped.location.country as string);
        const countryId = this.countryCache.get(countryKey);
        if (!countryId) throw new Error(`Country not resolved: ${mapped.location.country}`);
        const cityId = this.cityCache.get(`${countryId}:${normalizeKey(mapped.location.city)}`);
        if (!cityId) throw new Error(`City not resolved: ${mapped.location.city} (country ${mapped.location.country})`);
        return {
          name: mapped.name,
          address: mapped.address,
          cityId,
          latitude: mapped.latitude,
          longitude: mapped.longitude,
          phoneNumber: mapped.phoneNumber,
          sourceUrl: mapped.sourceUrl,
          websiteUrl: mapped.websiteUrl,
          description: mapped.description,
          priceLevel: mapped.priceLevel,
        };
      });

      const saved = await tx
        .insert(restaurants)
        .values(restaurantValues)
        .onConflictDoUpdate({
          target: restaurants.sourceUrl,
          set: {
            name: sql`excluded.name`,
            address: sql`excluded.address`,
            cityId: sql`excluded.city_id`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            phoneNumber: sql`excluded.phone_number`,
            websiteUrl: sql`excluded.website_url`,
            description: sql`excluded.description`,
            priceLevel: sql`excluded.price_level`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: restaurants.id, sourceUrl: restaurants.sourceUrl });

      const idBySourceUrl = new Map(saved.map(r => [r.sourceUrl, r.id]));
      const batchIds = saved.map(r => r.id);

      const awardRows: { restaurantId: number; awardTypeId: number; starsCount: number | null }[] = [];
      const cuisineRows: { restaurantId: number; cuisineId: number }[] = [];
      const facilityRows: { restaurantId: number; facilityId: number }[] = [];

      uniqueBatch.forEach(({ mapped }) => {
        const restaurantId = idBySourceUrl.get(mapped.sourceUrl);
        if (!restaurantId) return;

        const mainAwardTypeId = this.awardTypeCache.get(mapped.award.code);
        if (!mainAwardTypeId) throw new Error(`Award type not seeded: ${mapped.award.code}`);
        awardRows.push({ restaurantId, awardTypeId: mainAwardTypeId, starsCount: mapped.award.starsCount });
        if (mapped.greenStar) {
          const greenStarTypeId = this.awardTypeCache.get(GREEN_STAR_CODE);
          if (!greenStarTypeId) throw new Error('Green star award type not seeded');
          awardRows.push({ restaurantId, awardTypeId: greenStarTypeId, starsCount: null });
        }

        const seenCuisineIds = new Set<number>();
        mapped.cuisines.forEach(name => {
          const entry = this.cuisineCache.get(normalizeKey(name));
          if (entry && !seenCuisineIds.has(entry.id)) {
            seenCuisineIds.add(entry.id);
            cuisineRows.push({ restaurantId, cuisineId: entry.id });
          }
        });

        const seenFacilityIds = new Set<number>();
        mapped.facilities.forEach(name => {
          const facilityId = this.facilityCache.get(normalizeKey(name));
          if (facilityId && !seenFacilityIds.has(facilityId)) {
            seenFacilityIds.add(facilityId);
            facilityRows.push({ restaurantId, facilityId });
          }
        });
      });

      if (batchIds.length) {
        await tx.delete(restaurantAwards).where(inArray(restaurantAwards.restaurantId, batchIds));
        await tx.delete(restaurantCuisines).where(inArray(restaurantCuisines.restaurantId, batchIds));
        await tx.delete(restaurantFacilities).where(inArray(restaurantFacilities.restaurantId, batchIds));
      }
      if (awardRows.length) await tx.insert(restaurantAwards).values(awardRows);
      if (cuisineRows.length) await tx.insert(restaurantCuisines).values(cuisineRows);
      if (facilityRows.length) await tx.insert(restaurantFacilities).values(facilityRows);

      return saved.length;
    });
  };

  private resetCaches = (): void => {
    this.countryCache.clear();
    this.cityCache.clear();
    this.cuisineCache.clear();
    this.facilityCache.clear();
    this.awardTypeCache.clear();
  };

  private preloadTaxonomyCaches = async (): Promise<void> => {
    const db = this.databaseService.db;
    const [countryRows, cityRows, cuisineRows, facilityRows, awardTypeRows] = await Promise.all([
      db.select({ id: countries.id, name: countries.name }).from(countries),
      db.select({ id: cities.id, name: cities.name, countryId: cities.countryId }).from(cities),
      db
        .select({ id: cuisines.id, name: cuisines.name, normalizedName: cuisines.normalizedName })
        .from(cuisines),
      db
        .select({ id: facilities.id, name: facilities.name, normalizedName: facilities.normalizedName })
        .from(facilities),
      db.select({ id: awardTypes.id, code: awardTypes.code }).from(awardTypes),
    ]);
    countryRows.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));
    cityRows.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));
    cuisineRows.forEach(r => this.cuisineCache.set(r.normalizedName, { id: r.id, name: r.name }));
    facilityRows.forEach(r => this.facilityCache.set(r.normalizedName, r.id));
    awardTypeRows.forEach(r => this.awardTypeCache.set(r.code, r.id));
  };

  private seedOfficialCuisines = async (): Promise<void> => {
    const content = await readFile(`${process.cwd()}/cuisine_categories.md`, 'utf-8');
    const cuisineNames = content
      .split('\n')
      .map(line => line.trim().match(/^\d+\.\s+(.*)$/)?.[1]?.trim())
      .filter((line): line is string => Boolean(line));
    await this.ensureCuisinesBulk(cuisineNames);
  };

  private seedStandardAwardTypes = async (): Promise<void> => {
    const needed = AWARD_CODES.filter(code => !this.awardTypeCache.has(code));
    if (!needed.length) return;
    const inserted = await this.databaseService.db
      .insert(awardTypes)
      .values(needed.map(code => ({ code })))
      .onConflictDoNothing({ target: awardTypes.code })
      .returning({ id: awardTypes.id, code: awardTypes.code });
    inserted.forEach(r => this.awardTypeCache.set(r.code, r.id));
    const missing = needed.filter(code => !this.awardTypeCache.has(code));
    if (missing.length) {
      const rows = await this.databaseService.db
        .select({ id: awardTypes.id, code: awardTypes.code })
        .from(awardTypes)
        .where(inArray(awardTypes.code, missing as unknown as string[]));
      rows.forEach(r => this.awardTypeCache.set(r.code, r.id));
    }
  };

  private ensureCountriesBulk = async (names: string[]): Promise<void> => {
    const uniq = new Map<string, string>();
    names.forEach(raw => {
      const key = normalizeKey(raw);
      if (key && !this.countryCache.has(key)) uniq.set(key, normalizeLabel(raw));
    });
    if (!uniq.size) return;

    const inserted = await this.databaseService.db
      .insert(countries)
      .values([...uniq.values()].map(name => ({ name })))
      .onConflictDoNothing({ target: countries.name })
      .returning({ id: countries.id, name: countries.name });
    inserted.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));

    const missingKeys = [...uniq.keys()].filter(k => !this.countryCache.has(k));
    if (!missingKeys.length) return;
    const missingNames = missingKeys.map(k => uniq.get(k) as string);
    const rows = await this.databaseService.db
      .select({ id: countries.id, name: countries.name })
      .from(countries)
      .where(inArray(countries.name, missingNames));
    rows.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));
  };

  private ensureCitiesBulk = async (pairs: { country: string; city: string }[]): Promise<void> => {
    const uniq = new Map<string, { countryId: number; name: string }>();
    pairs.forEach(({ country, city }) => {
      const countryId = this.countryCache.get(normalizeKey(country));
      const cityKey = normalizeKey(city);
      if (!countryId || !cityKey) return;
      const key = `${countryId}:${cityKey}`;
      if (!this.cityCache.has(key)) uniq.set(key, { countryId, name: normalizeLabel(city) });
    });
    if (!uniq.size) return;

    const inserted = await this.databaseService.db
      .insert(cities)
      .values([...uniq.values()])
      .onConflictDoNothing({ target: [cities.countryId, cities.name] })
      .returning({ id: cities.id, name: cities.name, countryId: cities.countryId });
    inserted.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));

    const missingEntries = [...uniq].filter(([key]) => !this.cityCache.has(key));
    if (!missingEntries.length) return;
    const conditions = missingEntries.map(([, value]) =>
      and(eq(cities.countryId, value.countryId), eq(cities.name, value.name)),
    );
    const rows = await this.databaseService.db
      .select({ id: cities.id, name: cities.name, countryId: cities.countryId })
      .from(cities)
      .where(or(...conditions));
    rows.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));
  };

  private ensureFacilitiesBulk = async (names: string[]): Promise<void> => {
    const uniq = new Map<string, string>();
    names.forEach(raw => {
      const key = normalizeKey(raw);
      if (key && !this.facilityCache.has(key)) uniq.set(key, normalizeLabel(raw));
    });
    if (!uniq.size) return;

    const inserted = await this.databaseService.db
      .insert(facilities)
      .values([...uniq].map(([normalizedName, name]) => ({ name, normalizedName })))
      .onConflictDoNothing({ target: facilities.normalizedName })
      .returning({ id: facilities.id, name: facilities.name, normalizedName: facilities.normalizedName });
    inserted.forEach(r => this.facilityCache.set(r.normalizedName, r.id));

    const missing = [...uniq.keys()].filter(k => !this.facilityCache.has(k));
    if (!missing.length) return;
    const rows = await this.databaseService.db
      .select({ id: facilities.id, name: facilities.name, normalizedName: facilities.normalizedName })
      .from(facilities)
      .where(inArray(facilities.normalizedName, missing));
    rows.forEach(r => this.facilityCache.set(r.normalizedName, r.id));
  };

  private ensureCuisinesBulk = async (names: string[]): Promise<void> => {
    const uniq = new Map<string, string>();
    names.forEach(raw => {
      const key = normalizeKey(raw);
      if (key && !this.cuisineCache.has(key)) uniq.set(key, normalizeLabel(raw));
    });
    if (!uniq.size) return;

    const inserted = await this.databaseService.db
      .insert(cuisines)
      .values([...uniq].map(([normalizedName, name]) => ({ name, normalizedName })))
      .onConflictDoNothing({ target: cuisines.normalizedName })
      .returning({ id: cuisines.id, name: cuisines.name, normalizedName: cuisines.normalizedName });
    inserted.forEach(r => this.cuisineCache.set(r.normalizedName, { id: r.id, name: r.name }));

    const missing = [...uniq.keys()].filter(k => !this.cuisineCache.has(k));
    if (!missing.length) return;
    const rows = await this.databaseService.db
      .select({ id: cuisines.id, name: cuisines.name, normalizedName: cuisines.normalizedName })
      .from(cuisines)
      .where(inArray(cuisines.normalizedName, missing));
    rows.forEach(r => this.cuisineCache.set(r.normalizedName, { id: r.id, name: r.name }));
  };
}
