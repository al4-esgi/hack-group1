import { Injectable, NotFoundException } from "@nestjs/common";
import { schema } from "src/database/database.schema";
import { DatabaseService } from "src/database/database.service";
import { eq } from "drizzle-orm";
import { UserRoleEnum } from "./_utils/user-role.enum";
import { CreateUser } from "./_utils/types/create-user.types";

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
      return this.databaseService.db
    .insert(schema.user)
    .values({
      email: params.email,
      firstname: params.firstname,
      lastname: params.lastname || "",
      google_id: params.googleId,
      photo_url: params.photoUrl,
      role: UserRoleEnum.USER
    })
    .onConflictDoUpdate({
      target: schema.user.google_id,
      set: {
        email: params.email,
        firstname: params.firstname,
        lastname: params.lastname || "",
        photo_url: params.photoUrl,
      }
    })
    .returning()
    .then((users) => users[0]);
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
