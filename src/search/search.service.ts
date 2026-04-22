import { Injectable } from '@nestjs/common';
import { and, eq, ilike, inArray, notInArray, or, sql, type SQL } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { GREEN_STAR_CODE, MICHELIN_STAR_CODE } from 'src/restaurants/_constants';
import { hotelAmenities } from 'src/hotels/hotel-amenities.entity';
import { hotelHotelAmenities } from 'src/hotels/hotel-hotel-amenities.entity';
import { hotels } from 'src/hotels/hotels.entity';
import {
  awardTypes,
  cities,
  countries,
  cuisines,
  facilities,
  restaurantAwards,
  restaurantCuisines,
  restaurantFacilities,
  restaurants,
} from 'src/restaurants/entities';
import { SearchType, UnifiedSearchQueryDto, UnifiedSearchSortBy } from './_utils/dto/request/unified-search.query.dto';
import {
  UnifiedHotelItemDto,
  UnifiedRestaurantItemDto,
  UnifiedSearchResultDto,
} from './_utils/dto/response/unified-search-result.dto';

type RawUnifiedRow = Record<string, unknown> & {
  type: string;
  id: number;
  name: string;
  address: string | null;
  lat: string | null;
  lng: string | null;
  city: string | null;
  country: string | null;
  created_at: Date;
  distance_meters: number | null;
  hotel_details: string | null;
  restaurant_details: string | null;
};

function getPgExecuteRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows: unknown }).rows;
    if (Array.isArray(rows)) return rows as T[];
  }
  return [];
}

@Injectable()
export class SearchService {
  constructor(private readonly databaseService: DatabaseService) {}

  search = async (query: UnifiedSearchQueryDto): Promise<UnifiedSearchResultDto> => {
    const subqueries: SQL[] = [];

    if (query.includesHotels) {
      const hotelSql = this.buildHotelSubquery(query);
      if (hotelSql) subqueries.push(hotelSql);
    }

    if (query.includesRestaurants) {
      const restaurantSql = this.buildRestaurantSubquery(query);
      if (restaurantSql) subqueries.push(restaurantSql);
    }

    if (subqueries.length === 0) {
      return { hotels: [], restaurants: [], meta: { currentPage: query.page, totalItemsCount: 0, totalPagesCount: 0, itemsPerPage: query.limit } };
    }

    const unionSql = subqueries.length === 1
      ? subqueries[0]
      : sql`(${subqueries[0]}) UNION ALL (${subqueries[1]})`;

    const orderBy = this.buildOrderBy(query);

    const countQuery = sql`SELECT count(*)::int AS total FROM (${unionSql}) AS _union_count`;
    const dataQuery = sql`
      SELECT * FROM (${unionSql}) AS _union_data
      ${orderBy}
      LIMIT ${query.limit} OFFSET ${query.skip}
    `;

    const [countResult, dataResult] = await Promise.all([
      this.databaseService.db.execute<{ total: number }>(countQuery),
      this.databaseService.db.execute<RawUnifiedRow>(dataQuery),
    ]);

    const countRows = getPgExecuteRows<{ total: number }>(countResult);
    const total = Number(countRows[0]?.total ?? 0);
    const rows = getPgExecuteRows<RawUnifiedRow>(dataResult);

    const hotelItems: UnifiedHotelItemDto[] = [];
    const restaurantItems: UnifiedRestaurantItemDto[] = [];

    for (const row of rows) {
      if (row.type === 'hotel') {
        hotelItems.push(this.mapHotelRow(row));
      } else {
        restaurantItems.push(this.mapRestaurantRow(row));
      }
    }

    return {
      hotels: hotelItems,
      restaurants: restaurantItems,
      meta: {
        currentPage: query.page,
        totalItemsCount: total,
        totalPagesCount: total === 0 ? 0 : Math.ceil(total / query.limit),
        itemsPerPage: query.limit,
      },
    };
  };

  // ─── Hotel subquery builder ───

  private buildHotelSubquery(query: UnifiedSearchQueryDto): SQL | null {
    const whereClauses: SQL[] = [];

    // Shared filters
    const textClause = this.hotelTextClause(query.search);
    if (textClause) whereClauses.push(textClause);

    if (query.cityId) whereClauses.push(eq(hotels.cityId, query.cityId));
    if (query.countryId) whereClauses.push(eq(hotels.countryId, query.countryId));

    // Geo filter
    if (query.hasGeo) {
      whereClauses.push(
        sql`ST_DWithin(${hotels.location}, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${query.radiusMeters})`,
      );
    }

    // Hotel-specific filters
    if (query.amenityIds?.length) {
      whereClauses.push(
        inArray(
          hotels.id,
          this.databaseService.db
            .select({ id: hotelHotelAmenities.hotelId })
            .from(hotelHotelAmenities)
            .where(inArray(hotelHotelAmenities.amenityId, query.amenityIds)),
        ),
      );
    }
    if (query.sustainableHotel !== undefined) whereClauses.push(eq(hotels.sustainableHotel, query.sustainableHotel));
    if (query.bookable !== undefined) whereClauses.push(eq(hotels.bookable, query.bookable));
    if (query.isPlus !== undefined) whereClauses.push(eq(hotels.isPlus, query.isPlus));
    if (query.distinction?.trim()) whereClauses.push(eq(hotels.distinctions, query.distinction.trim()));

    const whereExpr = whereClauses.length > 0 ? and(...whereClauses) : sql`true`;

    const amenitiesAgg = sql`coalesce((
      SELECT array_agg(${hotelAmenities.name} ORDER BY ${hotelAmenities.name})
      FROM ${hotelHotelAmenities}
      INNER JOIN ${hotelAmenities} ON ${hotelAmenities.id} = ${hotelHotelAmenities.amenityId}
      WHERE ${hotelHotelAmenities.hotelId} = ${hotels.id}
    ), ARRAY[]::text[])`;

    const distanceExpr = query.hasGeo
      ? sql`ST_Distance(${hotels.location}, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography)`
      : sql`NULL::float8`;

    return sql`
      SELECT
        'hotel' AS type,
        ${hotels.id} AS id,
        ${hotels.name} AS name,
        ${hotels.address}::text AS address,
        ${hotels.lat}::text AS lat,
        ${hotels.lng}::text AS lng,
        ${cities.name} AS city,
        ${countries.name} AS country,
        ${hotels.createdAt} AS created_at,
        ${distanceExpr} AS distance_meters,
        jsonb_build_object(
          'content', ${hotels.content},
          'mainImageUrl', ${hotels.mainImageUrl},
          'phone', ${hotels.phone},
          'distinctions', ${hotels.distinctions},
          'isPlus', coalesce(${hotels.isPlus}, false),
          'sustainableHotel', coalesce(${hotels.sustainableHotel}, false),
          'bookable', coalesce(${hotels.bookable}, false),
          'amenities', ${amenitiesAgg}
        ) AS hotel_details,
        NULL::jsonb AS restaurant_details
      FROM ${hotels}
      LEFT JOIN ${cities} ON ${cities.id} = ${hotels.cityId}
      LEFT JOIN ${countries} ON ${countries.id} = ${hotels.countryId}
      WHERE ${whereExpr}
    `;
  }

  // ─── Restaurant subquery builder ───

  private buildRestaurantSubquery(query: UnifiedSearchQueryDto): SQL | null {
    const whereClauses: SQL[] = [];

    // Shared filters
    const textClause = this.restaurantTextClause(query.search);
    if (textClause) whereClauses.push(textClause);

    if (query.cityId) whereClauses.push(eq(cities.id, query.cityId));
    if (query.countryId) whereClauses.push(eq(cities.countryId, query.countryId));

    // Geo filter
    if (query.hasGeo) {
      whereClauses.push(
        sql`ST_DWithin(${restaurants.location}, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography, ${query.radiusMeters})`,
      );
    }

    // Restaurant-specific filters
    if (query.cuisineIds?.length) {
      whereClauses.push(
        inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantCuisines.restaurantId })
            .from(restaurantCuisines)
            .where(inArray(restaurantCuisines.cuisineId, query.cuisineIds)),
        ),
      );
    }
    if (query.facilityIds?.length) {
      whereClauses.push(
        inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantFacilities.restaurantId })
            .from(restaurantFacilities)
            .where(inArray(restaurantFacilities.facilityId, query.facilityIds)),
        ),
      );
    }

    // Award filter
    const awardsClause = this.restaurantAwardsClause(query);
    if (awardsClause) whereClauses.push(awardsClause);

    // Green star
    if (query.greenStar !== undefined) {
      const withGreen = this.databaseService.db
        .select({ id: restaurantAwards.restaurantId })
        .from(restaurantAwards)
        .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
        .where(eq(awardTypes.code, GREEN_STAR_CODE));
      whereClauses.push(query.greenStar ? inArray(restaurants.id, withGreen) : notInArray(restaurants.id, withGreen));
    }

    // Price level
    if (query.minPriceLevel) whereClauses.push(sql`${restaurants.priceLevel} >= ${query.minPriceLevel}`);
    if (query.maxPriceLevel) whereClauses.push(sql`${restaurants.priceLevel} <= ${query.maxPriceLevel}`);

    const whereExpr = whereClauses.length > 0 ? and(...whereClauses) : sql`true`;

    const cuisinesAgg = sql`coalesce((
      SELECT array_agg(${cuisines.name} ORDER BY ${cuisines.name})
      FROM ${restaurantCuisines}
      INNER JOIN ${cuisines} ON ${cuisines.id} = ${restaurantCuisines.cuisineId}
      WHERE ${restaurantCuisines.restaurantId} = ${restaurants.id}
    ), ARRAY[]::text[])`;

    const facilitiesAgg = sql`coalesce((
      SELECT array_agg(${facilities.name} ORDER BY ${facilities.name})
      FROM ${restaurantFacilities}
      INNER JOIN ${facilities} ON ${facilities.id} = ${restaurantFacilities.facilityId}
      WHERE ${restaurantFacilities.restaurantId} = ${restaurants.id}
    ), ARRAY[]::text[])`;

    const awardCodeSub = sql`(
      SELECT ${awardTypes.code}
      FROM ${restaurantAwards}
      INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
      WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
      ORDER BY CASE WHEN ${awardTypes.code} = ${GREEN_STAR_CODE} THEN 1 ELSE 0 END, ${awardTypes.code}
      LIMIT 1
    )`;

    const starsSub = sql`(
      SELECT MAX(${restaurantAwards.starsCount})
      FROM ${restaurantAwards}
      WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
    )`;

    const greenStarSub = sql`coalesce((
      SELECT BOOL_OR(${awardTypes.code} = ${GREEN_STAR_CODE})
      FROM ${restaurantAwards}
      INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
      WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
    ), false)`;

    const distanceExpr = query.hasGeo
      ? sql`ST_Distance(${restaurants.location}, ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography)`
      : sql`NULL::float8`;

    return sql`
      SELECT
        'restaurant' AS type,
        ${restaurants.id} AS id,
        ${restaurants.name} AS name,
        ${restaurants.address}::text AS address,
        ${restaurants.latitude}::text AS lat,
        ${restaurants.longitude}::text AS lng,
        ${cities.name} AS city,
        ${countries.name} AS country,
        ${restaurants.createdAt} AS created_at,
        ${distanceExpr} AS distance_meters,
        NULL::jsonb AS hotel_details,
        jsonb_build_object(
          'description', ${restaurants.description},
          'sourceUrl', ${restaurants.sourceUrl},
          'websiteUrl', ${restaurants.websiteUrl},
          'phoneNumber', ${restaurants.phoneNumber},
          'awardCode', ${awardCodeSub},
          'stars', ${starsSub},
          'hasGreenStar', ${greenStarSub},
          'cuisines', ${cuisinesAgg},
          'facilities', ${facilitiesAgg},
          'priceLevel', ${restaurants.priceLevel}
        ) AS restaurant_details
      FROM ${restaurants}
      INNER JOIN ${cities} ON ${cities.id} = ${restaurants.cityId}
      INNER JOIN ${countries} ON ${countries.id} = ${cities.countryId}
      WHERE ${whereExpr}
    `;
  }

  // ─── Helpers ───

  private buildOrderBy(query: UnifiedSearchQueryDto): SQL {
    const dir = query.sortDirection === 'ASC' ? sql`ASC` : sql`DESC`;

    switch (query.sortBy) {
      case UnifiedSearchSortBy.DISTANCE:
        if (query.hasGeo) {
          return sql`ORDER BY distance_meters ASC NULLS LAST, id ASC`;
        }
        return sql`ORDER BY name ${dir}, id ASC`;

      case UnifiedSearchSortBy.CREATED_AT:
        return sql`ORDER BY created_at ${dir}, id ASC`;

      case UnifiedSearchSortBy.NAME:
      default:
        return sql`ORDER BY name ${dir}, id ASC`;
    }
  }

  private hotelTextClause(search: string | undefined): SQL | undefined {
    const safe = search?.trim()?.replace(/[%_]/g, '');
    if (!safe) return undefined;
    return or(ilike(hotels.name, `%${safe}%`), ilike(hotels.content, `%${safe}%`));
  }

  private restaurantTextClause(search: string | undefined): SQL | undefined {
    const safe = search?.trim()?.replace(/[%_]/g, '');
    if (!safe) return undefined;
    return or(ilike(restaurants.name, `%${safe}%`), ilike(restaurants.description, `%${safe}%`));
  }

  private restaurantAwardsClause(query: UnifiedSearchQueryDto): SQL | undefined {
    const hasStarsFilter = query.minStars !== undefined || query.maxStars !== undefined;
    const trimmedCode = query.awardCode?.trim();
    if (!hasStarsFilter && !trimmedCode) return undefined;

    const effectiveCode = trimmedCode ?? (hasStarsFilter ? MICHELIN_STAR_CODE : undefined);

    const clauses: SQL[] = [];
    if (effectiveCode) clauses.push(eq(awardTypes.code, effectiveCode));
    if (query.minStars !== undefined) clauses.push(sql`${restaurantAwards.starsCount} >= ${query.minStars}`);
    if (query.maxStars !== undefined) clauses.push(sql`${restaurantAwards.starsCount} <= ${query.maxStars}`);

    return inArray(
      restaurants.id,
      this.databaseService.db
        .select({ id: restaurantAwards.restaurantId })
        .from(restaurantAwards)
        .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
        .where(and(...clauses)),
    );
  }

  private mapHotelRow(row: RawUnifiedRow): UnifiedHotelItemDto {
    const details = typeof row.hotel_details === 'string'
      ? JSON.parse(row.hotel_details)
      : row.hotel_details ?? {};

    return {
      id: row.id,
      name: row.name,
      address: row.address,
      content: details.content ?? null,
      mainImageUrl: details.mainImageUrl ?? null,
      lat: row.lat,
      lng: row.lng,
      phone: details.phone ?? null,
      city: row.city ?? '',
      country: row.country ?? '',
      createdAt: row.created_at,
      distinctions: details.distinctions ?? null,
      isPlus: details.isPlus ?? false,
      sustainableHotel: details.sustainableHotel ?? false,
      bookable: details.bookable ?? false,
      amenities: details.amenities ?? [],
      distanceMeters: row.distance_meters,
    };
  }

  private mapRestaurantRow(row: RawUnifiedRow): UnifiedRestaurantItemDto {
    const details = typeof row.restaurant_details === 'string'
      ? JSON.parse(row.restaurant_details)
      : row.restaurant_details ?? {};

    return {
      id: row.id,
      name: row.name,
      address: row.address ?? '',
      description: details.description ?? '',
      sourceUrl: details.sourceUrl ?? '',
      websiteUrl: details.websiteUrl ?? null,
      latitude: row.lat ?? '',
      longitude: row.lng ?? '',
      phoneNumber: details.phoneNumber ?? null,
      city: row.city ?? '',
      country: row.country ?? '',
      createdAt: row.created_at,
      awardCode: details.awardCode ?? null,
      stars: details.stars ?? null,
      hasGreenStar: details.hasGreenStar ?? false,
      cuisines: details.cuisines ?? [],
      facilities: details.facilities ?? [],
      priceLevel: details.priceLevel ?? null,
      distanceMeters: row.distance_meters,
    };
  }
}
