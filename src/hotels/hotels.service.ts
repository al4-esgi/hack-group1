import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/database/database.service';
import { SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { cities } from 'src/restaurants/entities/cities.entity';
import { countries } from 'src/restaurants/entities/countries.entity';
import { hotelAmenities } from './hotel-amenities.entity';
import { hotelHotelAmenities } from './hotel-hotel-amenities.entity';
import { hotels } from './hotels.entity';
import { AutocompleteQueryDto } from './_utils/dto/request/autocomplete.query.dto';
import { HotelSearchSortBy, SearchHotelsQueryDto } from './_utils/dto/request/search-hotels.query.dto';
import { AutocompleteOptionDto } from './_utils/dto/response/autocomplete-option.dto';
import { GetHotelsPaginatedDto } from './_utils/dto/response/get-hotels-paginated.dto';
import { HotelDetailsDto } from './_utils/dto/response/hotel-details.dto';
import { HotelSearchItemDto } from './_utils/dto/response/hotel-search-item.dto';

@Injectable()
export class HotelsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly amenitiesAggSql = sql<string[]>`coalesce((
    SELECT array_agg(${hotelAmenities.name} ORDER BY ${hotelAmenities.name})
    FROM ${hotelHotelAmenities}
    INNER JOIN ${hotelAmenities} ON ${hotelAmenities.id} = ${hotelHotelAmenities.amenityId}
    WHERE ${hotelHotelAmenities.hotelId} = ${hotels.id}
  ), ARRAY[]::text[])`;

  searchHotels = async (query: SearchHotelsQueryDto): Promise<GetHotelsPaginatedDto> => {
    const whereClauses = [
      this.getTextClause(query),
      this.getCityClause(query),
      this.getCountryClause(query),
      this.getAmenitiesClause(query),
      this.getSustainableClause(query),
      this.getBookableClause(query),
      this.getIsPlusClause(query),
      this.getDistinctionClause(query),
    ].filter((clause): clause is SQL => Boolean(clause));
    const whereExpression = whereClauses.length > 0 ? and(...whereClauses) : undefined;

    const sortAsc = query.sortDirection === SortDirection.ASC;
    const orderByDir = sortAsc ? asc : desc;

    const orderByClause = (() => {
      switch (query.sortBy) {
        case HotelSearchSortBy.CREATED_AT:
          return orderByDir(hotels.createdAt);
        case HotelSearchSortBy.NAME:
        default:
          return orderByDir(hotels.name);
      }
    })();

    const totalQuery = this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(hotels)
      .leftJoin(cities, eq(cities.id, hotels.cityId))
      .leftJoin(countries, eq(countries.id, hotels.countryId))
      .where(whereExpression);

    const rowsQuery = this.databaseService.db
      .select({
        id: hotels.id,
        name: hotels.name,
        address: hotels.address,
        content: hotels.content,
        canonicalUrl: hotels.canonicalUrl,
        mainImageUrl: hotels.mainImageUrl,
        lat: hotels.lat,
        lng: hotels.lng,
        phone: hotels.phone,
        createdAt: hotels.createdAt,
        city: cities.name,
        country: countries.name,
        distinctions: hotels.distinctions,
        isPlus: sql<boolean>`coalesce(${hotels.isPlus}, false)`,
        sustainableHotel: sql<boolean>`coalesce(${hotels.sustainableHotel}, false)`,
        bookable: sql<boolean>`coalesce(${hotels.bookable}, false)`,
        amenities: this.amenitiesAggSql,
      })
      .from(hotels)
      .leftJoin(cities, eq(cities.id, hotels.cityId))
      .leftJoin(countries, eq(countries.id, hotels.countryId))
      .where(whereExpression)
      .orderBy(orderByClause, asc(hotels.id))
      .limit(query.limit)
      .offset(query.skip);

    const [totalRows, rows] = await Promise.all([totalQuery, rowsQuery]);

    return new GetHotelsPaginatedDto(
      rows as unknown as HotelSearchItemDto[],
      query,
      totalRows[0]?.count ?? 0,
    );
  };

  getHotelById = async (id: number): Promise<HotelDetailsDto> => {
    const [result] = await this.databaseService.db
      .select({
        id: hotels.id,
        name: hotels.name,
        address: hotels.address,
        content: hotels.content,
        canonicalUrl: hotels.canonicalUrl,
        mainImageUrl: hotels.mainImageUrl,
        lat: hotels.lat,
        lng: hotels.lng,
        phone: hotels.phone,
        postalCode: hotels.postalCode,
        neighborhood: hotels.neighborhood,
        createdAt: hotels.createdAt,
        cityId: cities.id,
        city: cities.name,
        countryId: countries.id,
        country: countries.name,
        distinctions: hotels.distinctions,
        isPlus: sql<boolean>`coalesce(${hotels.isPlus}, false)`,
        sustainableHotel: sql<boolean>`coalesce(${hotels.sustainableHotel}, false)`,
        bookable: sql<boolean>`coalesce(${hotels.bookable}, false)`,
        numRooms: hotels.numRooms,
        checkInTime: hotels.checkInTime,
        checkOutTime: hotels.checkOutTime,
        languages: hotels.languages,
        amenities: this.amenitiesAggSql,
      })
      .from(hotels)
      .leftJoin(cities, eq(cities.id, hotels.cityId))
      .leftJoin(countries, eq(countries.id, hotels.countryId))
      .where(eq(hotels.id, id))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Hotel not found');
    }

    return result as unknown as HotelDetailsDto;
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

  autocompleteAmenities = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteOptions({
      table: hotelAmenities,
      idColumn: hotelAmenities.id,
      nameColumn: hotelAmenities.name,
      normalizedColumn: hotelAmenities.normalizedName,
      q,
      limit,
    });

  private getTextClause = ({ search }: SearchHotelsQueryDto): SQL | undefined => {
    const trimmed = search?.trim();
    if (!trimmed) return undefined;
    return or(ilike(hotels.name, `%${trimmed}%`), ilike(hotels.content, `%${trimmed}%`));
  };

  private getCityClause = ({ cityId }: SearchHotelsQueryDto): SQL | undefined =>
    cityId !== undefined && cityId !== null ? eq(hotels.cityId, cityId) : undefined;

  private getCountryClause = ({ countryId }: SearchHotelsQueryDto): SQL | undefined =>
    countryId !== undefined && countryId !== null ? eq(hotels.countryId, countryId) : undefined;

  private getAmenitiesClause = ({ amenityIds }: SearchHotelsQueryDto): SQL | undefined =>
    amenityIds?.length
      ? inArray(
          hotels.id,
          this.databaseService.db
            .select({ id: hotelHotelAmenities.hotelId })
            .from(hotelHotelAmenities)
            .where(inArray(hotelHotelAmenities.amenityId, amenityIds)),
        )
      : undefined;

  private getSustainableClause = ({ sustainableHotel }: SearchHotelsQueryDto): SQL | undefined =>
    sustainableHotel !== undefined ? eq(hotels.sustainableHotel, sustainableHotel) : undefined;

  private getBookableClause = ({ bookable }: SearchHotelsQueryDto): SQL | undefined =>
    bookable !== undefined ? eq(hotels.bookable, bookable) : undefined;

  private getIsPlusClause = ({ isPlus }: SearchHotelsQueryDto): SQL | undefined =>
    isPlus !== undefined ? eq(hotels.isPlus, isPlus) : undefined;

  private getDistinctionClause = ({ distinction }: SearchHotelsQueryDto): SQL | undefined => {
    const trimmed = distinction?.trim();
    return trimmed ? eq(hotels.distinctions, trimmed) : undefined;
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
