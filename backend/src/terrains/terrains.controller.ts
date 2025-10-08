import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TerrainsService } from './terrains.service';
import { CreateTerrainDto } from './dto/create-terrain.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('admin/terrains')
@Controller('admin/terrains')
export class TerrainsController {
  constructor(private readonly terrainsService: TerrainsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Liste des terrains' })
  async list() {
    return this.terrainsService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiResponse({ status: 201, description: 'Terrain créé' })
  @ApiResponse({ status: 400, description: 'name required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() body: CreateTerrainDto) {
    if (!body?.name) throw new Error('name required');
    return this.terrainsService.create(body);
  }
}
