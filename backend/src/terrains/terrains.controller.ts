import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TerrainsService } from './terrains.service';
import { CreateTerrainDto } from './dto/create-terrain.dto';

@ApiTags('admin/terrains')
@ApiHeader({ name: 'x-admin-token', required: true, description: 'Admin token' })
@Controller('admin/terrains')
export class TerrainsController {
  constructor(private readonly terrainsService: TerrainsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Terrain créé' })
  @ApiResponse({ status: 400, description: 'name required' })
  @ApiResponse({ status: 401, description: 'Unauthorized (x-admin-token manquant ou invalide)' })
  async create(@Body() body: CreateTerrainDto, @Headers('x-admin-token') token?: string) {
    const expected = process.env.ADMIN_TOKEN || 'dev-admin-token';
    if (token !== expected) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (!body?.name) throw new HttpException('name required', HttpStatus.BAD_REQUEST);
    return this.terrainsService.create(body);
  }
}
