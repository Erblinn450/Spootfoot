import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class CreateSlotDto {
  @ApiProperty({ example: '66f1c2a1e8b0f9a9d1234567', description: 'ID du terrain (ObjectId)' })
  @IsMongoId()
  terrainId!: string;

  @ApiProperty({ example: '2025-10-01T18:00:00.000Z', description: 'Date/heure ISO du début' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: 60, description: 'Durée du slot en minutes', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @ApiProperty({ example: 10, description: 'Capacité du slot', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
