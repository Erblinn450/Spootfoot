import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { ReservationsModule } from '../reservations/reservations.module';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [ReservationsModule, SlotsModule],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
