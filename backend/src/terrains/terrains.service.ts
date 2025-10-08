import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Terrain, TerrainDocument } from './terrain.schema';

@Injectable()
export class TerrainsService {
  constructor(@InjectModel(Terrain.name) private terrainModel: Model<TerrainDocument>) {}

  async create(data: { name: string; address?: string }) {
    const doc = new this.terrainModel({ name: data.name, address: data.address });
    return doc.save();
  }

  async listAll() {
    return this.terrainModel.find({}).sort({ name: 1 }).lean().exec();
  }
}
