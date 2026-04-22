import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { DatabaseService } from 'src/database/database.service';
import { SortDirection } from 'src/_utils/dto/requests/paginated-query.dto';
import { AutocompleteOptionDto } from 'src/_utils/dto/responses/autocomplete-option.dto';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { cities } from 'src/restaurants/entities/cities.entity';
import { countries } from 'src/restaurants/entities/countries.entity';
import { hotelAmenities } from './hotel-amenities.entity';
import { hotelHotelAmenities } from './hotel-hotel-amenities.entity';
import { hotels } from './hotels.entity';
import { HotelSearchSortBy, SearchHotelsQueryDto } from './_utils/dto/request/search-hotels.query.dto';
import { GetHotelsPaginatedDto } from './_utils/dto/response/get-hotels-paginated.dto';
import { HotelDetailsDto } from './_utils/dto/response/hotel-details.dto';
import { HotelSearchItemDto } from './_utils/dto/response/hotel-search-item.dto';

@Injectable()
export class HotelsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly autocompleteHelper: AutocompleteHelper,
  ) {}

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
    this.autocompleteHelper.autocompleteOptions({
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
    this.autocompleteHelper.autocompleteOptions({
      table: cities,
      idColumn: cities.id,
      nameColumn: cities.name,
      additionalWhere: countryId ? eq(cities.countryId, countryId) : undefined,
      q,
      limit,
    });

  autocompleteAmenities = (q: string | undefined, limit: number): Promise<AutocompleteOptionDto[]> =>
    this.autocompleteHelper.autocompleteOptions({
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
    const safe = trimmed.replace(/[%_]/g, '');
    if (!safe) return undefined;
    return or(ilike(hotels.name, `%${safe}%`), ilike(hotels.content, `%${safe}%`));
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
}
