import { ApiProperty } from '@nestjs/swagger';

export class AutocompleteOptionDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'France' })
  name: string;
}
