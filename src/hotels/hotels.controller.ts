import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AutocompleteQueryDto, CityAutocompleteQueryDto } from './_utils/dto/request/autocomplete.query.dto';
import { SearchHotelsQueryDto } from './_utils/dto/request/search-hotels.query.dto';
import { AutocompleteOptionDto } from './_utils/dto/response/autocomplete-option.dto';
import { GetHotelsPaginatedDto } from './_utils/dto/response/get-hotels-paginated.dto';
import { HotelDetailsDto } from './_utils/dto/response/hotel-details.dto';
import { HotelsService } from './hotels.service';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  @ApiOperation({ summary: 'Search hotels with advanced filters.' })
  @ApiOkResponse({ type: GetHotelsPaginatedDto })
  searchHotels(@Query() query: SearchHotelsQueryDto): Promise<GetHotelsPaginatedDto> {
    return this.hotelsService.searchHotels(query);
  }

  @Get('filters/countries')
  @ApiOperation({ summary: 'Countries for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCountries(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.hotelsService.autocompleteCountries(query.q, query.limit);
  }

  @Get('filters/cities')
  @ApiOperation({ summary: 'Cities for autocomplete (optional `q`, optional `countryId`).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteCities(@Query() query: CityAutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.hotelsService.autocompleteCities(query.q, query.limit, query.countryId);
  }

  @Get('filters/amenities')
  @ApiOperation({ summary: 'Hotel amenities for autocomplete (optional `q` substring filter).' })
  @ApiOkResponse({ type: [AutocompleteOptionDto] })
  autocompleteAmenities(@Query() query: AutocompleteQueryDto): Promise<AutocompleteOptionDto[]> {
    return this.hotelsService.autocompleteAmenities(query.q, query.limit);
  }

  @Get(':hotelId')
  @ApiParam({ type: 'number', name: 'hotelId' })
  @ApiOperation({ summary: 'Get hotel details by ID.' })
  @ApiOkResponse({ type: HotelDetailsDto })
  @ApiNotFoundResponse({ description: 'Hotel not found.' })
  getHotelById(@Param('hotelId', ParseIntPipe) hotelId: number): Promise<HotelDetailsDto> {
    return this.hotelsService.getHotelById(hotelId);
  }
}
