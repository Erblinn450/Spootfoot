import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slot, SlotDocument } from './slot.schema';

@Injectable()
export class SlotsService {
  constructor(@InjectModel(Slot.name) private slotModel: Model<SlotDocument>) {}

  async create(data: { terrainId: string; startAt: string | Date; durationMin?: number; capacity?: number }) {
    const start = new Date(data.startAt);
    console.log('[SlotsService] Creating slot:', { terrainId: data.terrainId, startAt: data.startAt, parsed: start, now: new Date() });
    
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format for startAt');
    }
    
    if (start.getTime() <= Date.now()) {
      throw new BadRequestException(`startAt must be a future date. Provided: ${start.toISOString()}, Current: ${new Date().toISOString()}`);
    }
    
    const duration = data.durationMin ?? 60;
    const capacity = data.capacity ?? 10;
    return new this.slotModel({ terrainId: data.terrainId, startAt: start, durationMin: duration, capacity, status: 'OPEN' }).save();
  }

  async listPublic(filter?: { terrainId?: string; from?: Date; limit?: number }) {
    const query: any = { status: { $in: ['OPEN', 'RESERVED', 'FULL'] } };
    if (filter?.terrainId) query.terrainId = filter.terrainId;
    if (filter?.from) query.startAt = { $gte: filter.from };

    let q = this.slotModel.find(query).sort({ startAt: 1 }).lean();
    if (filter?.limit && filter.limit > 0) q = q.limit(filter.limit);
    return q;
  }

  async setStatus(slotId: string, status: 'OPEN' | 'RESERVED' | 'FULL' | 'CANCELLED') {
    return this.slotModel.findByIdAndUpdate(slotId, { status }, { new: true });
  }

  async getById(id: string) {
    return this.slotModel.findById(id);
  }

  // ADMIN ONLY
  async deleteById(id: string) {
    return this.slotModel.findByIdAndDelete(id);
  }

  async deleteAll() {
    return this.slotModel.deleteMany({});
  }
}
