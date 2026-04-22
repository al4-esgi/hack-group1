import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, notInArray, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/database/database.service';
import { SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { GREEN_STAR_CODE, MICHELIN_STAR_CODE } from './_constants';
import {
  RestaurantSearchSortBy,
  SearchRestaurantsQueryDto,
} from './_utils/dto/request/search-restaurants.query.dto';
import { AutocompleteOptionDto } from './_utils/dto/response/autocomplete-option.dto';
import { GetRestaurantsPaginatedDto } from './_utils/dto/response/get-restaurants-paginated.dto';
import { RestaurantDetailsDto } from './_utils/dto/response/restaurant-details.dto';
import { RestaurantSearchItemDto } from './_utils/dto/response/restaurant-search-item.dto';
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
} from './entities';

@Injectable()
export class RestaurantsService {
  /**
   * Aggregated per-restaurant awards subquery.
   *
   * We pre-group awards once and LEFT JOIN it instead of issuing three correlated subqueries
   * (stars, awardCode, hasGreenStar) per result row. Green star is demoted in the `awardCode`
   * ordering so it's only returned when no other distinction exists.
   */
  private readonly awardsSub: ReturnType<RestaurantsService['buildAwardsSub']>;

  constructor(private readonly databaseService: DatabaseService) {
    this.awardsSub = this.buildAwardsSub();
  }

  private buildAwardsSub = () =>
    this.databaseService.db
      .select({
        restaurantId: restaurantAwards.restaurantId,
        stars: sql<number | null>`MAX(${restaurantAwards.starsCount})`.as('stars'),
        awardCode: sql<string | null>`(
          ARRAY_AGG(${awardTypes.code} ORDER BY CASE WHEN ${awardTypes.code} = ${GREEN_STAR_CODE} THEN 1 ELSE 0 END, ${awardTypes.code})
        )[1]`.as('award_code'),
        hasGreenStar: sql<boolean>`BOOL_OR(${awardTypes.code} = ${GREEN_STAR_CODE})`.as('has_green_star'),
      })
      .from(restaurantAwards)
      .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
      .groupBy(restaurantAwards.restaurantId)
      .as('awards_sub');

  searchRestaurants = async (query: SearchRestaurantsQueryDto): Promise<GetRestaurantsPaginatedDto> => {
    const whereClauses = [
      this.getTextClause(query),
      this.getCityClause(query),
      this.getCountryClause(query),
      this.getCuisinesClause(query),
      this.getFacilitiesClause(query),
      this.getAwardsClause(query),
      this.getGreenStarClause(query),
      this.getPricesClause(query),
    ].filter((clause): clause is SQL => Boolean(clause));
    const whereExpression = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const sortAsc = query.sortDirection === SortDirection.ASC;
    const orderByDir = sortAsc ? asc : desc;
    const starsNullsLast = sortAsc
      ? sql`${this.awardsSub.stars} ASC NULLS LAST`
      : sql`${this.awardsSub.stars} DESC NULLS LAST`;

    const orderByClause = (() => {
      switch (query.sortBy) {
        case RestaurantSearchSortBy.CREATED_AT:
          return orderByDir(restaurants.createdAt);
        case RestaurantSearchSortBy.STARS:
          return starsNullsLast;
        case RestaurantSearchSortBy.NAME:
        default:
          return orderByDir(restaurants.name);
      }
    })();

    const totalQuery = this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(whereExpression);

    const rowsQuery = this.databaseService.db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        address: restaurants.address,
        description: restaurants.description,
        sourceUrl: restaurants.sourceUrl,
        websiteUrl: restaurants.websiteUrl,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        phoneNumber: restaurants.phoneNumber,
        createdAt: restaurants.createdAt,
        city: cities.name,
        country: countries.name,
        awardCode: this.awardsSub.awardCode,
        stars: this.awardsSub.stars,
        hasGreenStar: sql<boolean>`coalesce(${this.awardsSub.hasGreenStar}, false)`,
        cuisines: this.cuisinesAggSql,
        facilities: this.facilitiesAggSql,
        priceLevel: restaurants.priceLevel,
      })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .leftJoin(this.awardsSub, eq(this.awardsSub.restaurantId, restaurants.id))
      .where(whereExpression)
      .orderBy(orderByClause, asc(restaurants.id))
      .limit(query.limit)
      .offset(query.skip);

    const [totalRows, rows] = await Promise.all([totalQuery, rowsQuery]);

    return new GetRestaurantsPaginatedDto(
      rows as RestaurantSearchItemDto[],
      query,
      totalRows[0]?.count ?? 0,
    );
  };

  getRestaurantById = async (id: number): Promise<RestaurantDetailsDto> => {
    const [result] = await this.databaseService.db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        address: restaurants.address,
        description: restaurants.description,
        sourceUrl: restaurants.sourceUrl,
        websiteUrl: restaurants.websiteUrl,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        phoneNumber: restaurants.phoneNumber,
        createdAt: restaurants.createdAt,
        cityId: cities.id,
        city: cities.name,
        countryId: countries.id,
        country: countries.name,
        awardCode: sql<string | null>`(
          SELECT ${awardTypes.code}
          FROM ${restaurantAwards}
          INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
          ORDER BY CASE WHEN ${awardTypes.code} = ${GREEN_STAR_CODE} THEN 1 ELSE 0 END, ${awardTypes.code}
          LIMIT 1
        )`,
        stars: sql<number | null>`(
          SELECT MAX(${restaurantAwards.starsCount})
          FROM ${restaurantAwards}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
        )`,
        hasGreenStar: sql<boolean>`coalesce((
          SELECT BOOL_OR(${awardTypes.code} = ${GREEN_STAR_CODE})
          FROM ${restaurantAwards}
          INNER JOIN ${awardTypes} ON ${awardTypes.id} = ${restaurantAwards.awardTypeId}
          WHERE ${restaurantAwards.restaurantId} = ${restaurants.id}
        ), false)`,
        cuisines: this.cuisinesAggSql,
        facilities: this.facilitiesAggSql,
        priceLevel: restaurants.priceLevel,
      })
      .from(restaurants)
      .innerJoin(cities, eq(cities.id, restaurants.cityId))
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(eq(restaurants.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Restaurant not found');
    }

    return result as RestaurantDetailsDto;
  };

  autocompleteCountries = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteOptions({
      table: countries,
      idColumn: countries.id,
      nameColumn: countries.name,
      q,
      limit,
    });

  autocompleteCities = (
    q: string | undefined,
    limit: number,
    countryId?: number,
  ): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteOptions({
      table: cities,
      idColumn: cities.id,
      nameColumn: cities.name,
      additionalWhere: countryId ? eq(cities.countryId, countryId) : undefined,
      q,
      limit,
    });

  autocompleteCuisines = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteOptions({
      table: cuisines,
      idColumn: cuisines.id,
      nameColumn: cuisines.name,
      normalizedColumn: cuisines.normalizedName,
      q,
      limit,
    });

  autocompleteFacilities = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteOptions({
      table: facilities,
      idColumn: facilities.id,
      nameColumn: facilities.name,
      normalizedColumn: facilities.normalizedName,
      q,
      limit,
    });

  private readonly cuisinesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${cuisines.name} ORDER BY ${cuisines.name})
    FROM ${restaurantCuisines}
    INNER JOIN ${cuisines} ON ${cuisines.id} = ${restaurantCuisines.cuisineId}
    WHERE ${restaurantCuisines.restaurantId} = ${restaurants.id}
  ), ARRAY[]::text[])`;

  private readonly facilitiesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${facilities.name} ORDER BY ${facilities.name})
    FROM ${restaurantFacilities}
    INNER JOIN ${facilities} ON ${facilities.id} = ${restaurantFacilities.facilityId}
    WHERE ${restaurantFacilities.restaurantId} = ${restaurants.id}
  ), ARRAY[]::text[])`;

  private getTextClause = ({ search }: SearchRestaurantsQueryDto): SQL | undefined => {
    const trimmed = search?.trim();
    if (!trimmed) return undefined;
    return or(ilike(restaurants.name, `%${trimmed}%`), ilike(restaurants.description, `%${trimmed}%`));
  };

  private getCityClause = ({ cityId }: SearchRestaurantsQueryDto): SQL | undefined =>
    cityId !== undefined && cityId !== null ? eq(cities.id, cityId) : undefined;

  private getCountryClause = ({ countryId }: SearchRestaurantsQueryDto): SQL | undefined =>
    countryId !== undefined && countryId !== null ? eq(cities.countryId, countryId) : undefined;

  private getCuisinesClause = ({ cuisineIds }: SearchRestaurantsQueryDto): SQL | undefined =>
    cuisineIds?.length
      ? inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantCuisines.restaurantId })
            .from(restaurantCuisines)
            .where(inArray(restaurantCuisines.cuisineId, cuisineIds)),
        )
      : undefined;

  private getFacilitiesClause = ({ facilityIds }: SearchRestaurantsQueryDto): SQL | undefined =>
    facilityIds?.length
      ? inArray(
          restaurants.id,
          this.databaseService.db
            .select({ id: restaurantFacilities.restaurantId })
            .from(restaurantFacilities)
            .where(inArray(restaurantFacilities.facilityId, facilityIds)),
        )
      : undefined;

  /**
   * Award filter: when `minStars`/`maxStars` is set without `awardCode`, implicitly restricts
   * to MICHELIN_STAR awards (Bib Gourmand / Selected have no stars, so the filter would always
   * return 0 results otherwise).
   */
  private getAwardsClause = ({ awardCode, minStars, maxStars }: SearchRestaurantsQueryDto): SQL | undefined => {
    const hasStarsFilter = minStars !== undefined || maxStars !== undefined;
    const trimmedCode = awardCode?.trim();
    if (!hasStarsFilter && !trimmedCode) return undefined;

    const effectiveCode = trimmedCode ?? (hasStarsFilter ? MICHELIN_STAR_CODE : undefined);

    const clauses = [
      effectiveCode ? eq(awardTypes.code, effectiveCode) : undefined,
      minStars !== undefined ? sql`${restaurantAwards.starsCount} >= ${minStars}` : undefined,
      maxStars !== undefined ? sql`${restaurantAwards.starsCount} <= ${maxStars}` : undefined,
    ].filter((clause): clause is SQL => Boolean(clause));

    return inArray(
      restaurants.id,
      this.databaseService.db
        .select({ id: restaurantAwards.restaurantId })
        .from(restaurantAwards)
        .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
        .where(and(...clauses)),
    );
  };

  private getGreenStarClause = ({ greenStar }: SearchRestaurantsQueryDto): SQL | undefined => {
    if (greenStar === undefined) return undefined;
    const withGreen = this.databaseService.db
      .select({ id: restaurantAwards.restaurantId })
      .from(restaurantAwards)
      .innerJoin(awardTypes, eq(awardTypes.id, restaurantAwards.awardTypeId))
      .where(eq(awardTypes.code, GREEN_STAR_CODE));
    return greenStar ? inArray(restaurants.id, withGreen) : notInArray(restaurants.id, withGreen);
  };

  private getPricesClause = ({ minPriceLevel, maxPriceLevel }: SearchRestaurantsQueryDto): SQL | undefined => {
    const clauses = [
      minPriceLevel ? sql`${restaurants.priceLevel} >= ${minPriceLevel}` : undefined,
      maxPriceLevel ? sql`${restaurants.priceLevel} <= ${maxPriceLevel}` : undefined,
    ].filter((clause): clause is SQL => Boolean(clause));
    return clauses.length > 0 ? and(...clauses) : undefined;
  };

  private autocompleteOptions = async (params: {
    table: AnyPgTable;
    idColumn: PgColumn;
    nameColumn: PgColumn;
    normalizedColumn?: PgColumn;
    additionalWhere?: SQL;
    q: string | undefined;
    limit: number;
  }): Promise<AutocompleteOptionDto[]> => {
    const { table, idColumn, nameColumn, normalizedColumn, additionalWhere, q, limit } = params;
    const safe = this.getSafeAutocompleteTerm(q);
    const pattern = safe ? `%${safe}%` : undefined;

    const nameMatch = pattern
      ? normalizedColumn
        ? or(ilike(nameColumn, pattern), ilike(normalizedColumn, pattern))
        : ilike(nameColumn, pattern)
      : undefined;
    const whereExpr = and(...[additionalWhere, nameMatch].filter((clause): clause is SQL => Boolean(clause)));

    const base = this.databaseService.db
      .select({ id: idColumn, name: nameColumn })
      .from(table)
      .where(whereExpr);

    const query = safe
      ? base.orderBy(
          asc(this.autocompleteNameMatchPriority(nameColumn, safe, { normalizedColumn })),
          asc(nameColumn),
        )
      : base.orderBy(asc(nameColumn));

    const rows = await query.limit(limit);
    return rows.map(row => ({ id: row.id as number, name: row.name as string }));
  };

  private getSafeAutocompleteTerm = (q: string | undefined): string | undefined => {
    const trimmed = q?.trim();
    if (!trimmed) return undefined;
    const safe = trimmed.replace(/[%_]/g, '').slice(0, 100);
    return safe || undefined;
  };

  /**
   * 0 = whole label or any token (split on spaces / commas / slashes / hyphens) starts with the term
   * 1 = contains term but no "prefix" match (neither on full string nor on a word)
   * 2 = fallback
   */
  private autocompleteNameTokensStartWith = (nameColumn: PgColumn, prefix: string): SQL =>
    sql`EXISTS (
      SELECT 1
      FROM unnest(
        string_to_array(
          trim(
            regexp_replace(
              regexp_replace(cast(${nameColumn} as text), E'[,\\-–—/]+', ' ', 'g'),
              E'\\s+',
              ' ',
              'g'
            )
          ),
          ' '
        )
      ) AS t(token)
      WHERE btrim(t.token) <> '' AND t.token ILIKE ${prefix}
    )`;

  private autocompleteNameMatchPriority = (
    nameColumn: PgColumn,
    safe: string,
    options?: { normalizedColumn?: PgColumn },
  ): SQL => {
    const prefix = `${safe}%`;
    const contains = `%${safe}%`;
    const norm = options?.normalizedColumn;
    if (norm) {
      return sql`(
        CASE
          WHEN ${nameColumn} ILIKE ${prefix}
            OR ${norm} ILIKE ${prefix}
            OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
            OR ${this.autocompleteNameTokensStartWith(norm, prefix)}
          THEN 0
          WHEN ${nameColumn} ILIKE ${contains} OR ${norm} ILIKE ${contains}
          THEN 1
          ELSE 2
        END
      )`;
    }
    return sql`(
      CASE
        WHEN ${nameColumn} ILIKE ${prefix} OR ${this.autocompleteNameTokensStartWith(nameColumn, prefix)}
        THEN 0
        WHEN ${nameColumn} ILIKE ${contains}
        THEN 1
        ELSE 2
      END
    )`;
  };
}
