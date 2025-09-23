import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiResponse({ status: 201, description: "Réservation créée; renvoie l'inviteUrl" })
  @ApiResponse({ status: 400, description: 'slotId required ou body invalide' })
  @ApiResponse({ status: 404, description: 'slot inexistant' })
  @ApiResponse({ status: 409, description: 'slot non-OPEN (RESERVED|FULL)' })
  async create(@Body() body: CreateReservationDto) {
    if (!body?.slotId) throw new HttpException('slotId required', HttpStatus.BAD_REQUEST);
    return this.reservationsService.createReservation(body);
  }
}
