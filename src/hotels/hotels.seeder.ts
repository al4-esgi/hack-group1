import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { DatabaseService } from 'src/database/database.service';
import { normalizeKey, normalizeLabel } from 'src/restaurants/import/normalizers';
import { cities } from 'src/restaurants/entities/cities.entity';
import { countries } from 'src/restaurants/entities/countries.entity';
import { hotelAmenities } from './hotel-amenities.entity';
import { hotelHotelAmenities } from './hotel-hotel-amenities.entity';
import { hotels } from './hotels.entity';

type RawHotelAmenity = { id: number; amenity: string };
type RawGeoloc = { lat: number; lng: number };
type RawCity = { name: string };
type RawCountry = { name: string };
type RawRegion = { name: string } | null;
type RawCriteria = { atmosphere?: string; style?: string };
type RawMainImage = { hotrooms_large_url?: string };
type RawDistinction = { label?: string };

@Injectable()
export class HotelsSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HotelsSeederService.name);
  private readonly BATCH_SIZE = 200;

  // caches keyed by normalizedKey -> id
  private countryCache = new Map<string, number>();
  private cityCache = new Map<string, number>(); // `${countryId}:${normalizedCityName}`
  private amenityCache = new Map<string, number>(); // normalizedName -> id

  constructor(private readonly databaseService: DatabaseService) {}

  async onApplicationBootstrap() {
    await this.seedHotels();
  }

  private async seedHotels() {
    const db = this.databaseService.db;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(hotels);
    if (Number(count) > 0) {
      this.logger.log(`Hotels table already contains ${count} records, skipping seed.`);
      return;
    }

    const filePath = path.resolve(process.cwd(), 'hotels.jsonl');
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`hotels.jsonl not found at ${filePath}, skipping seed.`);
      return;
    }

    this.logger.log('Starting hotels seeding...');
    await this.preloadCaches();

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    type RawRecord = Record<string, unknown>;
    let batch: RawRecord[] = [];
    let total = 0;

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        batch.push(JSON.parse(line) as RawRecord);
      } catch {
        continue;
      }

      if (batch.length >= this.BATCH_SIZE) {
        const inserted = await this.persistBatch(batch);
        total += inserted;
        this.logger.log(`Inserted ${total} hotels...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      total += await this.persistBatch(batch);
    }

    this.logger.log(`Hotels seeding complete. Total inserted: ${total}`);
  }

  private async persistBatch(raws: Record<string, unknown>[]): Promise<number> {
    const db = this.databaseService.db;

    // 1. Ensure countries & cities exist
    const countryNames = [...new Set(raws.map(r => (r['country'] as RawCountry)?.name).filter(Boolean))];
    const cityPairs = raws
      .map(r => ({ country: (r['country'] as RawCountry)?.name, city: (r['city'] as RawCity)?.name }))
      .filter(p => p.country && p.city);

    await this.ensureCountries(countryNames as string[]);
    await this.ensureCities(cityPairs as { country: string; city: string }[]);

    // 2. Collect all amenities from this batch
    const allAmenities = raws.flatMap(r => (r['hotel_amenities'] as RawHotelAmenity[] | undefined) ?? []);
    await this.ensureAmenities(allAmenities);

    // 3. Insert hotels
    const hotelValues = raws.map(r => {
      const countryName = (r['country'] as RawCountry)?.name;
      const cityName = (r['city'] as RawCity)?.name;
      const countryId = countryName ? this.countryCache.get(normalizeKey(countryName)) ?? null : null;
      const cityId =
        countryId && cityName ? (this.cityCache.get(`${countryId}:${normalizeKey(cityName)}`) ?? null) : null;
      const geoloc = r['_geoloc'] as RawGeoloc | undefined;
      const criteria = r['criteria'] as RawCriteria | undefined;
      const mainImage = r['main_image'] as RawMainImage | undefined;
      const distinction = r['distinction'] as RawDistinction | undefined;

      return {
        objectId: String(r['objectID'] ?? r['object_id'] ?? ''),
        name: String(r['name'] ?? 'Unknown'),
        slug: r['slug'] as string | undefined,
        originalSlug: r['original_slug'] as string | undefined,
        canonicalUrl: r['canonical_url'] as string | undefined,
        content: r['content'] as string | undefined,
        address: Array.isArray(r['address']) ? (r['address'] as string[]).join(', ') : (r['address'] as string | undefined),
        phone: r['phone'] as string | undefined,
        postalCode: r['postal_code'] as string | undefined,
        neighborhood: r['neighborhood'] as string | undefined,
        currency: r['currency'] as string | undefined,
        cityId,
        countryId,
        regionName: (r['region'] as RawRegion)?.name ?? null,
        lat: geoloc?.lat != null ? String(geoloc.lat) : null,
        lng: geoloc?.lng != null ? String(geoloc.lng) : null,
        checkInTime: r['check_in_time'] as number | undefined,
        checkOutTime: r['check_out_time'] as number | undefined,
        numRooms: r['num_rooms'] as number | undefined,
        numReviews: r['num_reviews'] as number | undefined,
        lovedCount: r['loved_count'] as number | undefined,
        commissionRate: r['commission_rate'] as number | undefined,
        maxGuests: r['max_guests'] as number | undefined,
        maxChildren: r['max_children'] as number | undefined,
        bookable: r['bookable'] as boolean | undefined,
        isPlus: r['is_plus'] as boolean | undefined,
        sustainableHotel: r['sustainable_hotel'] as boolean | undefined,
        newToSelection: r['new_to_selection'] as boolean | undefined,
        hotelId: r['hotel_id'] as string | undefined,
        bookingDotComHotelId: r['booking_dot_com_hotel_id'] as number | undefined,
        mainImageUrl: mainImage?.hotrooms_large_url
          ? `https://${mainImage.hotrooms_large_url}`
          : undefined,
        distinctions: distinction?.label ?? null,
        criteriaAtmosphere: criteria?.atmosphere ?? null,
        criteriaStyle: criteria?.style ?? null,
        appClipBannerUrl: r['app_clip_banner_url'] as string | undefined,
        shortLink: r['short_link'] as string | undefined,
        michelinGuideUrl: r['michelin_guide_url'] as string | undefined,
        url: r['url'] as string | undefined,
        policy: r['policy'] as string | undefined,
        languages: r['languages'] as string[] | undefined,
      };
    });

    const saved = await db
      .insert(hotels)
      .values(hotelValues)
      .onConflictDoNothing({ target: hotels.objectId })
      .returning({ id: hotels.id, objectId: hotels.objectId });

    if (!saved.length) return 0;

    // 4. Insert hotel <-> amenity join rows
    const objectIdToDbId = new Map(saved.map(h => [h.objectId, h.id]));
    const amenityRows: { hotelId: number; amenityId: number }[] = [];

    raws.forEach(r => {
      const dbId = objectIdToDbId.get(String(r['objectID'] ?? r['object_id'] ?? ''));
      if (!dbId) return;
      const rawAmenities = (r['hotel_amenities'] as RawHotelAmenity[] | undefined) ?? [];
      const seen = new Set<number>();
      rawAmenities.forEach(({ amenity }) => {
        const amenityId = this.amenityCache.get(normalizeKey(amenity));
        if (amenityId && !seen.has(amenityId)) {
          seen.add(amenityId);
          amenityRows.push({ hotelId: dbId, amenityId });
        }
      });
    });

    if (amenityRows.length) {
      await db.insert(hotelHotelAmenities).values(amenityRows).onConflictDoNothing();
    }

    return saved.length;
  }

  private async preloadCaches(): Promise<void> {
    const db = this.databaseService.db;
    const [countryRows, cityRows, amenityRows] = await Promise.all([
      db.select({ id: countries.id, name: countries.name }).from(countries),
      db.select({ id: cities.id, name: cities.name, countryId: cities.countryId }).from(cities),
      db.select({ id: hotelAmenities.id, normalizedName: hotelAmenities.normalizedName }).from(hotelAmenities),
    ]);
    countryRows.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));
    cityRows.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));
    amenityRows.forEach(r => this.amenityCache.set(r.normalizedName, r.id));
  }

  private async ensureCountries(names: string[]): Promise<void> {
    const db = this.databaseService.db;
    const uniq = new Map<string, string>();
    names.forEach(raw => {
      const key = normalizeKey(raw);
      if (key && !this.countryCache.has(key)) uniq.set(key, normalizeLabel(raw));
    });
    if (!uniq.size) return;

    const inserted = await db
      .insert(countries)
      .values([...uniq.values()].map(name => ({ name })))
      .onConflictDoNothing({ target: countries.name })
      .returning({ id: countries.id, name: countries.name });
    inserted.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));

    const missing = [...uniq.keys()].filter(k => !this.countryCache.has(k));
    if (!missing.length) return;
    const rows = await db
      .select({ id: countries.id, name: countries.name })
      .from(countries)
      .where(inArray(countries.name, missing.map(k => uniq.get(k) as string)));
    rows.forEach(r => this.countryCache.set(normalizeKey(r.name), r.id));
  }

  private async ensureCities(pairs: { country: string; city: string }[]): Promise<void> {
    const db = this.databaseService.db;
    const uniq = new Map<string, { countryId: number; name: string }>();
    pairs.forEach(({ country, city }) => {
      const countryId = this.countryCache.get(normalizeKey(country));
      const cityKey = normalizeKey(city);
      if (!countryId || !cityKey) return;
      const key = `${countryId}:${cityKey}`;
      if (!this.cityCache.has(key)) uniq.set(key, { countryId, name: normalizeLabel(city) });
    });
    if (!uniq.size) return;

    const inserted = await db
      .insert(cities)
      .values([...uniq.values()])
      .onConflictDoNothing({ target: [cities.countryId, cities.name] })
      .returning({ id: cities.id, name: cities.name, countryId: cities.countryId });
    inserted.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));

    const missing = [...uniq].filter(([key]) => !this.cityCache.has(key));
    if (!missing.length) return;
    const rows = await db
      .select({ id: cities.id, name: cities.name, countryId: cities.countryId })
      .from(cities)
      .where(
        inArray(
          cities.id,
          (
            await Promise.all(
              missing.map(([, v]) =>
                db
                  .select({ id: cities.id })
                  .from(cities)
                  .where(and(eq(cities.countryId, v.countryId), eq(cities.name, v.name)))
                  .limit(1),
              ),
            )
          )
            .flat()
            .map(r => r.id),
        ),
      );
    rows.forEach(r => this.cityCache.set(`${r.countryId}:${normalizeKey(r.name)}`, r.id));
  }

  private async ensureAmenities(rawAmenities: RawHotelAmenity[]): Promise<void> {
    const db = this.databaseService.db;
    const uniq = new Map<string, string>();
    rawAmenities.forEach(({ amenity }) => {
      const key = normalizeKey(amenity);
      if (key && !this.amenityCache.has(key)) uniq.set(key, normalizeLabel(amenity));
    });
    if (!uniq.size) return;

    const inserted = await db
      .insert(hotelAmenities)
      .values([...uniq].map(([normalizedName, name]) => ({ name, normalizedName })))
      .onConflictDoNothing({ target: hotelAmenities.normalizedName })
      .returning({ id: hotelAmenities.id, normalizedName: hotelAmenities.normalizedName });
    inserted.forEach(r => this.amenityCache.set(r.normalizedName, r.id));

    const missing = [...uniq.keys()].filter(k => !this.amenityCache.has(k));
    if (!missing.length) return;
    const rows = await db
      .select({ id: hotelAmenities.id, normalizedName: hotelAmenities.normalizedName })
      .from(hotelAmenities)
      .where(inArray(hotelAmenities.normalizedName, missing));
    rows.forEach(r => this.amenityCache.set(r.normalizedName, r.id));
  }
}
