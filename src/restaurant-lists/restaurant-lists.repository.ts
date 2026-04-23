import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
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

export interface RestaurantListItemRow {
  itemType: string;
  itemId: number;
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
        itemsCount: sql<number>`(
          cast((
            select count(*)
            from ${schema.restaurantListRestaurants}
            where ${schema.restaurantListRestaurants.listId} = ${schema.restaurantLists.id}
          ) as int)
          +
          cast((
            select count(*)
            from ${schema.restaurantListItems}
            where ${schema.restaurantListItems.listId} = ${schema.restaurantLists.id}
          ) as int)
        )`,
      })
      .from(schema.restaurantLists)
      .where(eq(schema.restaurantLists.userId, userId))
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

  async findItemsByListId(listId: number): Promise<RestaurantListItemRow[]> {
    const [restaurantItems, genericItems] = await Promise.all([
      this.databaseService.db
      .select({
        itemType: sql<string>`'restaurant'`,
        itemId: schema.restaurants.id,
        name: schema.restaurants.name,
        addedAt: schema.restaurantListRestaurants.addedAt,
      })
      .from(schema.restaurantListRestaurants)
      .innerJoin(
        schema.restaurants,
        eq(schema.restaurants.id, schema.restaurantListRestaurants.restaurantId),
      )
      .where(eq(schema.restaurantListRestaurants.listId, listId)),
      this.databaseService.db
      .select({
        itemType: schema.restaurantListItems.itemType,
        itemId: schema.restaurantListItems.itemId,
        name: schema.restaurantListItems.name,
        addedAt: schema.restaurantListItems.addedAt,
      })
      .from(schema.restaurantListItems)
      .where(eq(schema.restaurantListItems.listId, listId)),
    ]);

    return [...restaurantItems, ...genericItems].sort(
      (a, b) => b.addedAt.getTime() - a.addedAt.getTime(),
    );
  }

  async countItemsByListId(listId: number): Promise<number> {
    const [restaurantCountResult, genericCountResult] = await Promise.all([
      this.databaseService.db
      .select({
        count: sql<number>`cast(count(${schema.restaurantListRestaurants.restaurantId}) as int)`,
      })
      .from(schema.restaurantListRestaurants)
      .where(eq(schema.restaurantListRestaurants.listId, listId)),
      this.databaseService.db
      .select({
        count: sql<number>`cast(count(${schema.restaurantListItems.id}) as int)`,
      })
      .from(schema.restaurantListItems)
      .where(eq(schema.restaurantListItems.listId, listId)),
    ]);

    return (restaurantCountResult[0]?.count ?? 0) + (genericCountResult[0]?.count ?? 0);
  }

  async findRestaurantById(restaurantId: number): Promise<{ id: number; name: string } | null> {
    const restaurants = await this.databaseService.db
      .select({
        id: schema.restaurants.id,
        name: schema.restaurants.name,
      })
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, restaurantId))
      .limit(1);

    return restaurants[0] ?? null;
  }

  async findHotelById(hotelId: number): Promise<{ id: number; name: string } | null> {
    const hotels = await this.databaseService.db
      .select({
        id: schema.hotel.id,
        name: schema.hotel.name,
      })
      .from(schema.hotel)
      .where(eq(schema.hotel.id, hotelId))
      .limit(1);

    return hotels[0] ?? null;
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

  async addRestaurantToList(listId: number, restaurantId: number): Promise<void> {
    await this.databaseService.db
      .insert(schema.restaurantListRestaurants)
      .values({
        listId,
        restaurantId,
      })
      .onConflictDoNothing({
        target: [
          schema.restaurantListRestaurants.listId,
          schema.restaurantListRestaurants.restaurantId,
        ],
      });
  }

  async addGenericItemToList(
    listId: number,
    itemType: string,
    itemId: number,
    name: string,
  ): Promise<void> {
    await this.databaseService.db
      .insert(schema.restaurantListItems)
      .values({
        listId,
        itemType,
        itemId,
        name,
      })
      .onConflictDoNothing({
        target: [
          schema.restaurantListItems.listId,
          schema.restaurantListItems.itemType,
          schema.restaurantListItems.itemId,
        ],
      });
  }
}
