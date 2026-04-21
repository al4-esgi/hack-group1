import { Test, TestingModule } from '@nestjs/testing';
import { InstagramScrapingController } from './instagram-scraping.controller';

describe('InstagramScrapingController', () => {
  let controller: InstagramScrapingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstagramScrapingController],
    }).compile();

    controller = module.get<InstagramScrapingController>(InstagramScrapingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
