import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Liste des slots' })
  async list() {
    return this.slotsService.listPublic();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Identifiant du slot' })
  @ApiResponse({ status: 200, description: 'Slot par id' })
  async getOne(@Param('id') id: string) {
    return this.slotsService.getById(id);
  }
}
