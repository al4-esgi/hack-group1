import { Module } from '@nestjs/common';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { RestaurantImportService } from 'src/restaurants/import/restaurant-import.service';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantImportService, RestaurantsService, AutocompleteHelper],
  exports: [RestaurantImportService, RestaurantsService],
})
export class RestaurantsModule {}
