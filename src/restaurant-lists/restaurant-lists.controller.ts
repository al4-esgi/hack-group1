import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Protect } from 'src/auth/_utils/decorator/protect.decorator';
import { ConnectedUser } from 'src/users/_utils/decorator/connecter-user.decorator';
import { GetUserType } from 'src/users/users.entity';
import { CreateRestaurantListDto } from './_utils/dto/request/create-restaurant-list.dto';
import { RenameRestaurantListDto } from './_utils/dto/request/rename-restaurant-list.dto';
import { RestaurantListContentDto } from './_utils/dto/response/restaurant-list-content.dto';
import { RestaurantListDto } from './_utils/dto/response/restaurant-list.dto';
import { RestaurantListsService } from './restaurant-lists.service';

@ApiTags('Restaurant Lists')
@Protect()
@Controller('users/:userId/lists')
export class RestaurantListsController {
  constructor(private readonly restaurantListsService: RestaurantListsService) {}

  @Get()
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiOperation({ summary: 'List all lists for a user with item count' })
  @ApiOkResponse({ type: [RestaurantListDto] })
  getListsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<RestaurantListDto[]> {
    return this.restaurantListsService.getListsByUserId(userId, connectedUser);
  }

  @Get('by-name/:listName/restaurants')
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiParam({ type: 'string', name: 'listName' })
  @ApiOperation({ summary: 'List restaurants in a list by list name' })
  @ApiOkResponse({ type: RestaurantListContentDto })
  getListContentByName(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listName') listName: string,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<RestaurantListContentDto> {
    return this.restaurantListsService.getListContentByName(
      userId,
      listName,
      connectedUser,
    );
  }

  @Get(':listId/restaurants')
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiParam({ type: 'number', name: 'listId' })
  @ApiOperation({ summary: 'List restaurants in a list by list ID' })
  @ApiOkResponse({ type: RestaurantListContentDto })
  getListContentById(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listId', ParseIntPipe) listId: number,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<RestaurantListContentDto> {
    return this.restaurantListsService.getListContentById(userId, listId, connectedUser);
  }

  @Post()
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiOperation({ summary: 'Create a new list for a user' })
  @ApiCreatedResponse({ type: RestaurantListDto })
  createList(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateRestaurantListDto,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<RestaurantListDto> {
    return this.restaurantListsService.createList(userId, dto, connectedUser);
  }

  @Patch(':listId')
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiParam({ type: 'number', name: 'listId' })
  @ApiOperation({ summary: 'Rename a user list' })
  @ApiOkResponse({ type: RestaurantListDto })
  renameList(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listId', ParseIntPipe) listId: number,
    @Body() dto: RenameRestaurantListDto,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<RestaurantListDto> {
    return this.restaurantListsService.renameList(userId, listId, dto, connectedUser);
  }

  @Delete(':listId')
  @HttpCode(204)
  @ApiParam({ type: 'number', name: 'userId' })
  @ApiParam({ type: 'number', name: 'listId' })
  @ApiOperation({ summary: 'Delete a user list' })
  @ApiNoContentResponse({ description: 'List deleted.' })
  deleteList(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('listId', ParseIntPipe) listId: number,
    @ConnectedUser() connectedUser: GetUserType,
  ): Promise<void> {
    return this.restaurantListsService.deleteList(userId, listId, connectedUser);
  }
}
