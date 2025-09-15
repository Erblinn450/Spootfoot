import { Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import crypto from 'node:crypto';
import { ReservationsService } from '../reservations/reservations.service';
import { SlotsService } from '../slots/slots.service';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly slotsService: SlotsService,
  ) {}

  private hash(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  @Get(':token')
  async getInfo(@Param('token') token: string) {
    const tokenHash = this.hash(token);
    const reservation = await this.reservationsService.findByTokenHash(tokenHash);
    if (!reservation) throw new HttpException('not found', HttpStatus.NOT_FOUND);
    const slot = await this.slotsService.getById(String(reservation.slotId));
    if (!slot) throw new HttpException('slot not found', HttpStatus.NOT_FOUND);
    const restants = (slot.capacity ?? 10) - (reservation.acceptedCount ?? 0);
    return {
      slot: {
        startAt: slot.startAt,
        durationMin: slot.durationMin,
        capacity: slot.capacity,
        status: slot.status,
      },
      restants,
    };
  }

  @Post(':token/accept')
  async accept(@Param('token') token: string) {
    const tokenHash = this.hash(token);
    const reservation = await this.reservationsService.findByTokenHash(tokenHash);
    if (!reservation) throw new HttpException('not found', HttpStatus.NOT_FOUND);
    const slot = await this.slotsService.getById(String(reservation.slotId));
    if (!slot) throw new HttpException('slot not found', HttpStatus.NOT_FOUND);

    const updated = await this.reservationsService.atomicAccept(tokenHash, slot.capacity);
    if (!updated) {
      // full or race beyond capacity
      return { statusCode: 409, message: 'FULL' };
    }

    if (updated.acceptedCount >= slot.capacity) {
      await this.slotsService.setStatus(String(reservation.slotId), 'FULL');
    }

    return { acceptedCount: updated.acceptedCount };
  }

  @Post(':token/decline')
  async decline() {
    // No-op by spec
    return { statusCode: 204 };
  }
}
