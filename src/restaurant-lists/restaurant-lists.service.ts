import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetUserType } from 'src/users/users.entity';
import { UserRoleEnum } from 'src/users/_utils/user-role.enum';
import { AddListItemDto } from './_utils/dto/request/add-list-item.dto';
import { CreateRestaurantListDto } from './_utils/dto/request/create-restaurant-list.dto';
import { RenameRestaurantListDto } from './_utils/dto/request/rename-restaurant-list.dto';
import { RestaurantListContentDto } from './_utils/dto/response/restaurant-list-content.dto';
import { RestaurantListDto } from './_utils/dto/response/restaurant-list.dto';
import { normalizeRestaurantListName } from './_utils/functions/normalize-restaurant-list-name.function';
import { RestaurantListsMapper } from './restaurant-lists.mapper';
import { RestaurantListsRepository } from './restaurant-lists.repository';

@Injectable()
export class RestaurantListsService {
  private readonly listNotFound = new NotFoundException('List not found');
  private readonly restaurantNotFound = new NotFoundException('Restaurant not found');
  private readonly hotelNotFound = new NotFoundException('Hotel not found');
  private readonly listNameAlreadyExists = new BadRequestException('A list with this name already exists');

  constructor(
    private readonly restaurantListsRepository: RestaurantListsRepository,
    private readonly restaurantListsMapper: RestaurantListsMapper,
  ) {}

  async getListsByUserId(userId: number, connectedUser: GetUserType): Promise<RestaurantListDto[]> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const lists = await this.restaurantListsRepository.findListsByUserIdWithItemsCount(userId);
    return lists.map(this.restaurantListsMapper.toRestaurantListDto);
  }

  async getListContentById(
    userId: number,
    listId: number,
    connectedUser: GetUserType,
  ): Promise<RestaurantListContentDto> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const list = await this.restaurantListsRepository.findListById(userId, listId);
    if (!list) {
      throw this.listNotFound;
    }

    const items = await this.restaurantListsRepository.findItemsByListId(list.id);
    return this.restaurantListsMapper.toRestaurantListContentDto(list, items);
  }

  async getListContentByName(
    userId: number,
    listName: string,
    connectedUser: GetUserType,
  ): Promise<RestaurantListContentDto> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const normalizedName = normalizeRestaurantListName(listName);
    const list = await this.restaurantListsRepository.findListByNormalizedName(userId, normalizedName);
    if (!list) {
      throw this.listNotFound;
    }

    const items = await this.restaurantListsRepository.findItemsByListId(list.id);
    return this.restaurantListsMapper.toRestaurantListContentDto(list, items);
  }

  async createList(
    userId: number,
    dto: CreateRestaurantListDto,
    connectedUser: GetUserType,
  ): Promise<RestaurantListDto> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const normalizedName = normalizeRestaurantListName(dto.name);

    try {
      const list = await this.restaurantListsRepository.createList(userId, dto.name, normalizedName);
      return this.restaurantListsMapper.toRestaurantListDtoFromEntity(list, 0);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw this.listNameAlreadyExists;
      }
      throw error;
    }
  }

  async renameList(
    userId: number,
    listId: number,
    dto: RenameRestaurantListDto,
    connectedUser: GetUserType,
  ): Promise<RestaurantListDto> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const existingList = await this.restaurantListsRepository.findListById(userId, listId);
    if (!existingList) {
      throw this.listNotFound;
    }

    const normalizedName = normalizeRestaurantListName(dto.name);
    try {
      const updated = await this.restaurantListsRepository.renameList(userId, listId, dto.name, normalizedName);
      if (!updated) {
        throw this.listNotFound;
      }

      const itemsCount = await this.restaurantListsRepository.countItemsByListId(listId);
      return this.restaurantListsMapper.toRestaurantListDtoFromEntity(updated, itemsCount);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw this.listNameAlreadyExists;
      }
      throw error;
    }
  }

  async deleteList(userId: number, listId: number, connectedUser: GetUserType): Promise<void> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const existingList = await this.restaurantListsRepository.findListById(userId, listId);
    if (!existingList) {
      throw this.listNotFound;
    }

    await this.restaurantListsRepository.deleteList(userId, listId);
  }

  async addRestaurantToList(
    userId: number,
    listId: number,
    restaurantId: number,
    connectedUser: GetUserType,
  ): Promise<void> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const existingList = await this.restaurantListsRepository.findListById(userId, listId);
    if (!existingList) {
      throw this.listNotFound;
    }

    const restaurant = await this.restaurantListsRepository.findRestaurantById(restaurantId);
    if (!restaurant) {
      throw this.restaurantNotFound;
    }

    await this.restaurantListsRepository.addRestaurantToList(listId, restaurantId);
  }

  async addListItem(
    userId: number,
    listId: number,
    dto: AddListItemDto,
    connectedUser: GetUserType,
  ): Promise<void> {
    this.assertUserCanAccessLists(userId, connectedUser);

    const existingList = await this.restaurantListsRepository.findListById(userId, listId);
    if (!existingList) {
      throw this.listNotFound;
    }

    const itemType = dto.itemType;
    if (itemType === 'restaurant') {
      const restaurant = await this.restaurantListsRepository.findRestaurantById(dto.itemId);
      if (!restaurant) {
        throw this.restaurantNotFound;
      }

      await this.restaurantListsRepository.addRestaurantToList(listId, restaurant.id);
      return;
    }

    if (itemType === 'hotel') {
      const hotel = await this.restaurantListsRepository.findHotelById(dto.itemId);
      if (!hotel) {
        throw this.hotelNotFound;
      }

      await this.restaurantListsRepository.addGenericItemToList(
        listId,
        itemType,
        hotel.id,
        hotel.name,
      );
      return;
    }

    if (!dto.name) {
      throw new BadRequestException('name is required for custom item types');
    }

    await this.restaurantListsRepository.addGenericItemToList(
      listId,
      itemType,
      dto.itemId,
      dto.name,
    );
  }

  private assertUserCanAccessLists(userId: number, connectedUser: GetUserType): void {
    if (connectedUser.role === UserRoleEnum.ADMIN) {
      return;
    }

    if (connectedUser.id === userId) {
      return;
    }

    throw new ForbiddenException('FORBIDDEN');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (error as { code?: string })?.code === '23505';
  }
}
