import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('admin/slots')
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Post()
  async create(
    @Body() body: { terrainId: string; startAt: string; durationMin?: number; capacity?: number },
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
