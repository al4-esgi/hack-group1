import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnifiedSearchQueryDto } from './_utils/dto/request/unified-search.query.dto';
import { UnifiedSearchResultDto } from './_utils/dto/response/unified-search-result.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Unified search across hotels and restaurants with geo filtering.',
    description:
      'Returns hotels and/or restaurants matching the given filters. ' +
      'Use `types` to restrict to one type. Hotel-specific filters only apply to hotels; ' +
      'restaurant-specific filters only apply to restaurants. ' +
      'Provide `lat`, `lng`, and `radiusKm` together for geospatial radius search.',
  })
  @ApiOkResponse({ type: UnifiedSearchResultDto })
  search(@Query() query: UnifiedSearchQueryDto): Promise<UnifiedSearchResultDto> {
    return this.searchService.search(query);
  }
}
