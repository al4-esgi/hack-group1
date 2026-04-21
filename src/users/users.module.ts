import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UniqueExistsConstraint } from 'src/_utils/decorators/unique-exists.decorator';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { UserExistsRule } from './_utils/user-exist.rule';
import { UsersController } from './users.controller';
import { UsersMapper } from './users.mapper';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => JwtModule),
    EncryptionModule,
  ],
  providers: [UsersService, UsersRepository, UsersMapper, UserExistsRule],
  controllers: [UsersController],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
