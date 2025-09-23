import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { TerrainsModule } from './terrains/terrains.module';
import { SlotsModule } from './slots/slots.module';
import { ReservationsModule } from './reservations/reservations.module';
import { InvitationsModule } from './invitations/invitations.module';

const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo:27017/spotfoot';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    TerrainsModule,
    SlotsModule,
    ReservationsModule,
    InvitationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
