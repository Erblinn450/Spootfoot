import { Body, Controller, Delete, UseGuards, Param, Post } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('admin/slots')
@Controller('admin/slots')
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiResponse({ status: 201, description: 'Slot créé (status OPEN)' })
  @ApiResponse({ status: 400, description: 'terrainId and startAt required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() body: CreateSlotDto) {
    if (!body?.terrainId || !body?.startAt) {
      throw new Error('terrainId and startAt required');
    }
    // Enforce MVP constraints
    body.durationMin = 60;
    body.capacity = 10;
    return this.slotsService.create(body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiParam({ name: 'id', description: 'Identifiant du slot' })
  @ApiResponse({ status: 200, description: 'Slot supprimé' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteOne(@Param('id') id: string) {
    const res = await this.slotsService.deleteById(id);
    if (!res) return { deleted: 0 };
    return { deleted: 1, id };
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'Tous les slots supprimés' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAll() {
    const res = await this.slotsService.deleteAll();
    return { deletedCount: res.deletedCount ?? 0 };
  }
}
