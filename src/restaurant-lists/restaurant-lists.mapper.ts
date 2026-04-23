import { Injectable } from '@nestjs/common';
import { RestaurantListContentDto } from './_utils/dto/response/restaurant-list-content.dto';
import { RestaurantListDto } from './_utils/dto/response/restaurant-list.dto';
import { RestaurantListRestaurantDto } from './_utils/dto/response/restaurant-list-restaurant.dto';
import {
  RestaurantListRestaurantRow,
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
    restaurants: RestaurantListRestaurantRow[],
  ): RestaurantListContentDto => ({
    id: list.id,
    name: list.name,
    restaurants: restaurants.map(this.toRestaurantListRestaurantDto),
  });

  toRestaurantListRestaurantDto = (
    restaurant: RestaurantListRestaurantRow,
  ): RestaurantListRestaurantDto => ({
    id: restaurant.id,
    name: restaurant.name,
    addedAt: restaurant.addedAt,
  });
}
