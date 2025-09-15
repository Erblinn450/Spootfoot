import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { Reservation, ReservationDocument } from './reservation.schema';
import { SlotsService } from '../slots/slots.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private readonly slotsService: SlotsService,
  ) {}

  async createReservation(data: { slotId: string; organizerEmail?: string }) {
    const slot = await this.slotsService.getById(data.slotId);
    if (!slot) throw new HttpException('slot not found', HttpStatus.NOT_FOUND);
    if (slot.status !== 'OPEN') {
      throw new HttpException('slot not open', HttpStatus.CONFLICT);
    }
    const token = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.reservationModel.db.startSession();
    try {
      await session.withTransaction(async () => {
        // Create reservation
        await this.reservationModel.create([{ slotId: new Types.ObjectId(data.slotId), organizerEmail: data.organizerEmail, tokenHash, acceptedCount: 0 }], { session });
        // Update slot to RESERVED
        await this.slotsService.setStatus(data.slotId, 'RESERVED');
      });
    } finally {
      await session.endSession();
    }

    const publicUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    return { inviteUrl: `${publicUrl}/i/${token}` };
  }

  async findByTokenHash(tokenHash: string) {
    return this.reservationModel.findOne({ tokenHash });
  }

  async atomicAccept(tokenHash: string, capacity: number) {
    const updated = await this.reservationModel.findOneAndUpdate(
      { tokenHash, acceptedCount: { $lt: capacity } },
      { $inc: { acceptedCount: 1 } },
      { new: true },
    );
    return updated;
  }
}
