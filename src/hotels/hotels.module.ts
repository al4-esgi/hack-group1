import { Module } from '@nestjs/common';
import { AutocompleteHelper } from 'src/_shared/autocomplete/autocomplete.helper';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { HotelsSeederService } from './hotels.seeder';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService, HotelsSeederService, AutocompleteHelper],
  exports: [HotelsService],
})
export class HotelsModule {}
