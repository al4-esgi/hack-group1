import { PaginatedQueryDto } from '../../../../_utils/dto/requests/paginated-query.dto';
import { Optional } from 'class-validator-extended';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserPaginatedQueryDto extends PaginatedQueryDto {
  @ApiProperty({ description: 'Search by firstName, lastName or email' })
  @IsString()
  @Optional()
  search?: string;
}
