import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { TerrainsService } from './terrains.service';

@Controller('admin/terrains')
export class TerrainsController {
  constructor(private readonly terrainsService: TerrainsService) {}

  @Post()
  async create(@Body() body: { name: string; address?: string }, @Headers('x-admin-token') token?: string) {
    const expected = process.env.ADMIN_TOKEN || 'dev-admin-token';
    if (token !== expected) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!body?.name) throw new HttpException('name required', HttpStatus.BAD_REQUEST);
    return this.terrainsService.create(body);
  }
}
