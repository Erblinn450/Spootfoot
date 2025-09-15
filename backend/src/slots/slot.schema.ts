import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SlotDocument = HydratedDocument<Slot>;

export type SlotStatus = 'OPEN' | 'RESERVED' | 'FULL' | 'CANCELLED';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Slot {
  @Prop({ type: Types.ObjectId, ref: 'Terrain', required: true })
  terrainId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startAt!: Date;

  @Prop({ type: Number, required: true, default: 60 })
  durationMin!: number;

  @Prop({ type: Number, required: true, default: 10 })
  capacity!: number;

  @Prop({ type: String, required: true, enum: ['OPEN', 'RESERVED', 'FULL', 'CANCELLED'], default: 'OPEN' })
  status!: SlotStatus;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);
