import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { schema } from "src/database/database.schema";
import { DatabaseService } from "src/database/database.service";
import { eq } from "drizzle-orm";
import { UserRoleEnum } from "./_utils/user-role.enum";
import { CreateUser } from "./_utils/types/create-user.types";
import { defaultRestaurantListNames } from "src/restaurant-lists/_utils/constants/default-restaurant-list-names.constant";
import { normalizeRestaurantListName } from "src/restaurant-lists/_utils/functions/normalize-restaurant-list-name.function";

@Injectable()
export class UsersRepository {
  private readonly orFailNotFound = new NotFoundException("User not found");

  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  async findByGoogleId(googleId: string) {
    const users = await this.databaseService.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.google_id, googleId))
      .limit(1);

    return users[0] || null;
  }

  async findById(id: number) {
    const users = await this.databaseService.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);

    return users[0] || null;
  }

  async upsertGoogleUser(params: CreateUser) {
    const existingUser = await this.findByGoogleId(params.googleId);

    const users = await this.databaseService.db
      .insert(schema.user)
      .values({
        email: params.email,
        firstname: params.firstname,
        lastname: params.lastname || "",
        google_id: params.googleId,
        photo_url: params.photoUrl,
        role: UserRoleEnum.USER,
      })
      .onConflictDoUpdate({
        target: schema.user.google_id,
        set: {
          email: params.email,
          firstname: params.firstname,
          lastname: params.lastname || "",
          photo_url: params.photoUrl,
        },
      })
      .returning();

    const user = users[0];
    if (!user) {
      throw new InternalServerErrorException("Failed to upsert user");
    }

    if (!existingUser) {
      await this.createDefaultListsForUser(user.id);
    }

    return user;
  }

  private createDefaultListsForUser(userId: number): Promise<void> {
    return this.databaseService.db
      .insert(schema.restaurantLists)
      .values(
        defaultRestaurantListNames.map((listName) => ({
          userId,
          name: listName,
          normalizedName: normalizeRestaurantListName(listName),
        })),
      )
      .onConflictDoNothing({
        target: [
          schema.restaurantLists.userId,
          schema.restaurantLists.normalizedName,
        ],
      })
      .then(() => undefined);
  }

  // deleteUser = (userToDelete: UserDocument) =>
  //   this.model.findByIdAndUpdate(userToDelete._id, { deletedAt: new Date() }).exec();
  //
  // async findPaginated(userPaginatedQuery: UserPaginatedQueryDto) {
  //   const query: QueryFilter<UserDocument> = {
  //     deletedAt: null,
  //     ...(!isNil(userPaginatedQuery.search) &&
  //       ({
  //         $or: [
  //           { firstname: { $regex: userPaginatedQuery.search, $options: 'i' } },
  //           { lastname: { $regex: userPaginatedQuery.search, $options: 'i' } },
  //           { email: { $regex: userPaginatedQuery.search, $options: 'i' } },
  //         ],
  //       } as QueryFilter<UserDocument>)),
  //   };
  //   const totalCount = await this.model.countDocuments(query);
  //
  //   const results = await this.model
  //     .find(query)
  //     .sort(userPaginatedQuery.toMongoDbSort)
  //     .skip(userPaginatedQuery.skip)
  //     .limit(userPaginatedQuery.limit)
  //     .exec();
  //
  //   return { totalCount, results };
  // }
}
