import { Injectable } from '@nestjs/common';
import { RestaurantListContentDto } from './_utils/dto/response/restaurant-list-content.dto';
import { RestaurantListItemDto } from './_utils/dto/response/restaurant-list-item.dto';
import { RestaurantListDto } from './_utils/dto/response/restaurant-list.dto';
import {
  RestaurantListItemRow,
  RestaurantListWithItemsCountRow,
} from './restaurant-lists.repository';
import { SelectRestaurantList } from './restaurant-lists.entity';

@Injectable()
export class RestaurantListsMapper {
  toRestaurantListDto = (list: RestaurantListWithItemsCountRow): RestaurantListDto => ({
    id: list.id,
    name: list.name,
    itemsCount: list.itemsCount,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  });

  toRestaurantListDtoFromEntity = (list: SelectRestaurantList, itemsCount: number): RestaurantListDto => ({
    id: list.id,
    name: list.name,
    itemsCount,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  });

  toRestaurantListContentDto = (
    list: SelectRestaurantList,
    items: RestaurantListItemRow[],
  ): RestaurantListContentDto => ({
    id: list.id,
    name: list.name,
    items: items.map(this.toRestaurantListItemDto),
  });

  toRestaurantListItemDto = (
    item: RestaurantListItemRow,
  ): RestaurantListItemDto => ({
    itemType: item.itemType,
    itemId: item.itemId,
    name: item.name,
    addedAt: item.addedAt,
  });
}
