import { ApiProperty } from '@nestjs/swagger';

export class CreateTerrainDto {
  @ApiProperty({ example: 'Terrain A', description: 'Nom du terrain' })
  name!: string;

  @ApiProperty({ example: 'Strasbourg', required: false, description: 'Adresse (optionnelle)' })
  address?: string;
}
