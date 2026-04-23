import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetUserType } from 'src/users/users.entity';
import { UserRoleEnum } from 'src/users/_utils/user-role.enum';
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

    const restaurants = await this.restaurantListsRepository.findRestaurantsByListId(list.id);
    return this.restaurantListsMapper.toRestaurantListContentDto(list, restaurants);
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

    const restaurants = await this.restaurantListsRepository.findRestaurantsByListId(list.id);
    return this.restaurantListsMapper.toRestaurantListContentDto(list, restaurants);
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

    const restaurantExists = await this.restaurantListsRepository.restaurantExists(restaurantId);
    if (!restaurantExists) {
      throw this.restaurantNotFound;
    }

    await this.restaurantListsRepository.addRestaurantToList(listId, restaurantId);
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
