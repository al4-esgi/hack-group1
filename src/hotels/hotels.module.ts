import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { HotelsSeederService } from './hotels.seeder';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService, HotelsSeederService],
})
export class HotelsModule {}
