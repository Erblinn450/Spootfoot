import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slotId!: Types.ObjectId;

  @Prop()
  organizerEmail?: string;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ type: Number, required: true, default: 0 })
  acceptedCount!: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
