import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(@Body() body: { slotId: string; organizerEmail?: string }) {
    if (!body?.slotId) throw new HttpException('slotId required', HttpStatus.BAD_REQUEST);
    return this.reservationsService.createReservation(body);
  }
}
