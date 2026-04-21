import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './_utils/dto/request/create-user.dto';
import { EncryptionService } from 'src/encryption/encryption.service';
import { DATABASE_CLIENT_TOKEN } from 'src/database/database.providers';
import { schema } from 'src/database/database.schema';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersRepository {
  private readonly orFailNotFound = new NotFoundException('User not found');

  constructor(
    private readonly  databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // findOneById = (id: string) => this.model.findById(id).exec();
  //
  // findOneByIdOrThrow = (id: string) => this.model.findById(id).orFail(this.orFailNotFound).exec();
  //
  // findOneByEmailOrThrow = (email: string) =>
  //   this.model.findOne({ email: email, deletedAt: null }).orFail(this.orFailNotFound).exec();
  //
  // findOneByTokenOrThrow = (token: string) =>
  //   this.model
  //     .findOne({ recoveryToken: token, recoveryTokenExpires: { $gt: new Date() }, deletedAt: null })
  //     .orFail(this.orFailNotFound)
  //     .exec();
  //
  // updatePasswordById = async (id: Types.ObjectId, password: string) => {
  //   const hashedPassword = await this.encryptionService.encrypt(password);
  //   return this.model
  //     .findByIdAndUpdate(id, {
  //       password: hashedPassword,
  //       recoveryToken: null,
  //       recoveryTokenExpires: null,
  //     })
  //     .exec();
  // };
  //
  // userWithEmailExists = (email: string) => this.model.exists({ email: email, deletedAt: null }).exec();
  //
  // recoverAccountPassword = (email: string) =>
  //   this.model
  //     .findOneAndUpdate(
  //       { email: email },
  //       { recoveryToken: randomStringGenerator(), recoveryTokenExpires: dayjs().add(5, 'm').toDate() },
  //       { returnDocument: 'after' },
  //     )
  //     .orFail(this.orFailNotFound)
  //     .exec();

  async createUser(createUserDto: CreateUserDto) {
    const hashPassword = await this.encryptionService.encrypt(createUserDto.password);

    return this.databaseService.db.insert(schema.user).values({
      email: createUserDto.email,
      firstname: createUserDto.firstname,
      lastname: createUserDto.lastname,
      password: hashPassword,
    }).returning()
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
