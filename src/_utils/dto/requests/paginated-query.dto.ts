import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { Optional } from 'class-validator-extended';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginatedQueryDto {
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsNumber()
  @Min(1)
  private pageSize: number = 10;

  @IsString()
  @Optional()
  private sortBy?: string;

  @IsEnum(SortDirection)
  private sortDirection: SortDirection = SortDirection.DESC;

  private get toMongoDbSortDirection() {
    return this.sortDirection === SortDirection.ASC ? 1 : -1;
  }

  get toMongoDbSort(): { [key: string]: -1 | 1 } {
    return this.sortBy ? { [this.sortBy]: this.toMongoDbSortDirection } : { _id: this.toMongoDbSortDirection };
  }

  get skip() {
    return (this.page - 1) * this.pageSize;
  }

  get limit() {
    return this.pageSize;
  }
}
