import { PaginationDto } from '../../../../_utils/dto/responses/pagination.dto';
import { PaginatedQueryDto } from '../../../../_utils/dto/requests/paginated-query.dto';
import { GetUserLightDto } from './get-user-light.dto';

export class GetUsersPaginatedDto extends PaginationDto {
  users: GetUserLightDto[];

  constructor(users: GetUserLightDto[], paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    super(paginatedQuery, totalItemsCount);
    this.users = users;
  }
}
