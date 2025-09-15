import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TerrainDocument = HydratedDocument<Terrain>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Terrain {
  @Prop({ required: true })
  name!: string;

  @Prop()
  address?: string;
}

export const TerrainSchema = SchemaFactory.createForClass(Terrain);
