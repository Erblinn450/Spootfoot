import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
