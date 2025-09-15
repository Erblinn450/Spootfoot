import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot, SlotDocument } from './slot.schema';

@Injectable()
export class SlotsService {
  constructor(@InjectModel(Slot.name) private slotModel: Model<SlotDocument>) {}

  async create(data: { terrainId: string; startAt: string | Date; durationMin?: number; capacity?: number }) {
    const start = new Date(data.startAt);
    if (isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      throw new Error('startAt must be a future date');
    }
    const duration = data.durationMin ?? 60;
    const capacity = data.capacity ?? 10;
    return new this.slotModel({ terrainId: data.terrainId, startAt: start, durationMin: duration, capacity, status: 'OPEN' }).save();
  }

  async listPublic() {
    return this.slotModel.find({ status: { $in: ['OPEN', 'RESERVED', 'FULL'] } }).sort({ startAt: 1 }).lean();
  }

  async setStatus(slotId: string, status: 'OPEN' | 'RESERVED' | 'FULL' | 'CANCELLED') {
    return this.slotModel.findByIdAndUpdate(slotId, { status }, { new: true });
  }

  async getById(id: string) {
    return this.slotModel.findById(id);
  }
}
