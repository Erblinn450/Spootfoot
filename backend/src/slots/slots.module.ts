import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SlotsController } from './slots.controller';
import { AdminSlotsController } from './slots.admin.controller';
import { SlotsService } from './slots.service';
import { Slot, SlotSchema } from './slot.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Slot.name, schema: SlotSchema }])],
  controllers: [SlotsController, AdminSlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
