import { Test, TestingModule } from '@nestjs/testing';
import { InstagramScrapingService } from './instagram-scraping.service';

describe('InstagramScrapingService', () => {
  let service: InstagramScrapingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstagramScrapingService],
    }).compile();

    service = module.get<InstagramScrapingService>(InstagramScrapingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
