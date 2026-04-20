import { PaginatedQueryDto } from '../requests/paginated-query.dto';

export class PaginationMetaDto {
  currentPage: number;
  totalItemsCount: number;
  totalPagesCount: number;
  itemsPerPage: number;
}

export class PaginationDto {
  meta: PaginationMetaDto;

  constructor(paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    this.meta = {
      currentPage: paginatedQuery.page,
      totalItemsCount,
      totalPagesCount: totalItemsCount === 0 ? 0 : Math.ceil(totalItemsCount / paginatedQuery.limit),
      itemsPerPage: paginatedQuery.limit,
    };
  }
}
