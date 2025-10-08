import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTerrainDto {
  @ApiProperty({ example: 'Terrain A', description: 'Nom du terrain' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Strasbourg', required: false, description: 'Adresse (optionnelle)' })
  @IsOptional()
  @IsString()
  address?: string;
}
