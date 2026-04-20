import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UniqueExistsConstraint } from 'src/_utils/decorators/unique-exists.decorator';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { UserExistsRule } from './_utils/user-exist.rule';
import { UsersController } from './users.controller';
import { UsersMapper } from './users.mapper';
import { UsersRepository } from './users.repository';
import { User, UserSchema } from './users.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => JwtModule),
    EncryptionModule,
  ],
  providers: [UsersService, UsersRepository, UsersMapper, UserExistsRule, UniqueExistsConstraint],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
