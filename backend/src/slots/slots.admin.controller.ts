import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@ApiTags('admin/slots')
@ApiHeader({ name: 'x-admin-token', required: true, description: 'Admin token' })
@Controller('admin/slots')
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Slot créé (status OPEN)' })
  @ApiResponse({ status: 400, description: 'terrainId and startAt required' })
  @ApiResponse({ status: 401, description: 'Unauthorized (x-admin-token manquant ou invalide)' })
  async create(
    @Body() body: CreateSlotDto,
    @Headers('x-admin-token') token?: string,
  ) {
    const expected = process.env.ADMIN_TOKEN || 'dev-admin-token';
    if (token !== expected) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!body?.terrainId || !body?.startAt) {
      throw new HttpException('terrainId and startAt required', HttpStatus.BAD_REQUEST);
    }
    // Enforce MVP constraints
    body.durationMin = 60;
    body.capacity = 10;
    return this.slotsService.create(body);
  }
}
