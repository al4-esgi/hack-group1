import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { schema } from 'src/database/database.schema';
import { DatabaseService } from 'src/database/database.service';
import { SelectRestaurantList } from './restaurant-lists.entity';

export interface RestaurantListWithItemsCountRow {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  itemsCount: number;
}

export interface RestaurantListRestaurantRow {
  id: number;
  name: string;
  addedAt: Date;
}

@Injectable()
export class RestaurantListsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  findListsByUserIdWithItemsCount(userId: number): Promise<RestaurantListWithItemsCountRow[]> {
    return this.databaseService.db
      .select({
        id: schema.restaurantLists.id,
        name: schema.restaurantLists.name,
        createdAt: schema.restaurantLists.createdAt,
        updatedAt: schema.restaurantLists.updatedAt,
        itemsCount: sql<number>`cast(count(${schema.restaurantListRestaurants.restaurantId}) as int)`,
      })
      .from(schema.restaurantLists)
      .leftJoin(
        schema.restaurantListRestaurants,
        eq(schema.restaurantListRestaurants.listId, schema.restaurantLists.id),
      )
      .where(eq(schema.restaurantLists.userId, userId))
      .groupBy(
        schema.restaurantLists.id,
        schema.restaurantLists.name,
        schema.restaurantLists.createdAt,
        schema.restaurantLists.updatedAt,
      )
      .orderBy(asc(schema.restaurantLists.createdAt));
  }

  async findListById(userId: number, listId: number): Promise<SelectRestaurantList | null> {
    const lists = await this.databaseService.db
      .select()
      .from(schema.restaurantLists)
      .where(
        and(
          eq(schema.restaurantLists.id, listId),
          eq(schema.restaurantLists.userId, userId),
        ),
      )
      .limit(1);

    return lists[0] ?? null;
  }

  async findListByNormalizedName(userId: number, normalizedName: string): Promise<SelectRestaurantList | null> {
    const lists = await this.databaseService.db
      .select()
      .from(schema.restaurantLists)
      .where(
        and(
          eq(schema.restaurantLists.userId, userId),
          eq(schema.restaurantLists.normalizedName, normalizedName),
        ),
      )
      .limit(1);

    return lists[0] ?? null;
  }

  findRestaurantsByListId(listId: number): Promise<RestaurantListRestaurantRow[]> {
    return this.databaseService.db
      .select({
        id: schema.restaurants.id,
        name: schema.restaurants.name,
        addedAt: schema.restaurantListRestaurants.addedAt,
      })
      .from(schema.restaurantListRestaurants)
      .innerJoin(
        schema.restaurants,
        eq(schema.restaurants.id, schema.restaurantListRestaurants.restaurantId),
      )
      .where(eq(schema.restaurantListRestaurants.listId, listId))
      .orderBy(desc(schema.restaurantListRestaurants.addedAt));
  }

  async countItemsByListId(listId: number): Promise<number> {
    const [result] = await this.databaseService.db
      .select({
        count: sql<number>`cast(count(${schema.restaurantListRestaurants.restaurantId}) as int)`,
      })
      .from(schema.restaurantListRestaurants)
      .where(eq(schema.restaurantListRestaurants.listId, listId));

    return result?.count ?? 0;
  }

  async createList(userId: number, name: string, normalizedName: string): Promise<SelectRestaurantList> {
    const lists = await this.databaseService.db
      .insert(schema.restaurantLists)
      .values({
        userId,
        name,
        normalizedName,
      })
      .returning();

    const list = lists[0];
    if (!list) {
      throw new InternalServerErrorException('Failed to create list');
    }

    return list;
  }

  async renameList(
    userId: number,
    listId: number,
    name: string,
    normalizedName: string,
  ): Promise<SelectRestaurantList | null> {
    const lists = await this.databaseService.db
      .update(schema.restaurantLists)
      .set({
        name,
        normalizedName,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.restaurantLists.id, listId),
          eq(schema.restaurantLists.userId, userId),
        ),
      )
      .returning();

    return lists[0] ?? null;
  }

  async deleteList(userId: number, listId: number): Promise<void> {
    await this.databaseService.db
      .delete(schema.restaurantLists)
      .where(
        and(
          eq(schema.restaurantLists.id, listId),
          eq(schema.restaurantLists.userId, userId),
        ),
      );
  }
}
