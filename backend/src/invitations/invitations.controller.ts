import { Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import crypto from 'node:crypto';
import { ReservationsService } from '../reservations/reservations.service';
import { SlotsService } from '../slots/slots.service';

@ApiTags('invitations')
@Controller(['invitations', 'i'])
export class InvitationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly slotsService: SlotsService,
  ) {}

  private hash(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  @Get(':token')
  @ApiResponse({ status: 200, description: "Infos d'invitation (slot + places restantes)" })
  @ApiResponse({ status: 404, description: 'Invitation introuvable ou slot introuvable' })
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
  @ApiResponse({ status: 200, description: 'Acceptation enregistrée; retourne acceptedCount' })
  @ApiResponse({ status: 404, description: 'Invitation introuvable ou slot introuvable' })
  @ApiResponse({ status: 409, description: 'Capacité atteinte (FULL)' })
  async accept(@Param('token') token: string) {
    const tokenHash = this.hash(token);
    const reservation = await this.reservationsService.findByTokenHash(tokenHash);
    if (!reservation) throw new HttpException('not found', HttpStatus.NOT_FOUND);
    const slot = await this.slotsService.getById(String(reservation.slotId));
    if (!slot) throw new HttpException('slot not found', HttpStatus.NOT_FOUND);

    const updated = await this.reservationsService.atomicAccept(tokenHash, slot.capacity);
    if (!updated) {
      // full or race beyond capacity
      throw new HttpException('Capacité atteinte (FULL)', HttpStatus.CONFLICT);
    }

    if (updated.acceptedCount >= slot.capacity) {
      await this.slotsService.setStatus(String(reservation.slotId), 'FULL');
    }

    return { acceptedCount: updated.acceptedCount };
  }

  @Post(':token/decline')
  @ApiResponse({ status: 200, description: 'Déclinaison enregistrée' })
  @ApiResponse({ status: 404, description: 'Invitation introuvable' })
  async decline(@Param('token') token: string) {
    const tokenHash = this.hash(token);
    const reservation = await this.reservationsService.findByTokenHash(tokenHash);
    if (!reservation) throw new HttpException('not found', HttpStatus.NOT_FOUND);
    // No-op by spec - juste vérifier que l'invitation existe
    return { message: 'declined' };
  }
}
