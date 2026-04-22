import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './_utils/config/env.config';
import { NodemailerModule } from './nodemailer/nodemailer.module';
import { DatabaseModule } from './database/database.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { BootstrapService } from './bootstrap.service';
import { HotelsModule } from './hotels/hotels.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({ validate: validateEnv, isGlobal: true }),
    AuthModule,
    UsersModule,
    NodemailerModule,
    RestaurantsModule,
    HotelsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService, BootstrapService],
})
export class AppModule {}
