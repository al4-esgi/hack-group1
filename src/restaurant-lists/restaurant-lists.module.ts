import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { RestaurantListsController } from './restaurant-lists.controller';
import { RestaurantListsMapper } from './restaurant-lists.mapper';
import { RestaurantListsRepository } from './restaurant-lists.repository';
import { RestaurantListsService } from './restaurant-lists.service';

@Module({
  imports: [DatabaseModule],
  providers: [RestaurantListsService, RestaurantListsRepository, RestaurantListsMapper],
  controllers: [RestaurantListsController],
  exports: [RestaurantListsService, RestaurantListsRepository],
})
export class RestaurantListsModule {}
