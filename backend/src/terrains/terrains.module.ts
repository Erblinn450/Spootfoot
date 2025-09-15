import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TerrainsController } from './terrains.controller';
import { TerrainsService } from './terrains.service';
import { Terrain, TerrainSchema } from './terrain.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Terrain.name, schema: TerrainSchema }])],
  controllers: [TerrainsController],
  providers: [TerrainsService],
  exports: [TerrainsService],
})
export class TerrainsModule {}
