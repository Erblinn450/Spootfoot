import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: '66f1c2a1e8b0f9a9d1234567', description: 'ID du slot (ObjectId)' })
  slotId!: string;

  @ApiProperty({ example: 'organizer@example.com', required: false, description: "Email de l'organisateur" })
  organizerEmail?: string;
}
