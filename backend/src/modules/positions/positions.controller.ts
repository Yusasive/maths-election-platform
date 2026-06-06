import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { AdminService } from '../admin/admin.service';

@Controller('elections/:slug/positions')
export class PositionsController {
  constructor(
    private readonly positionsService: PositionsService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return this.positionsService.list(slug);
  }

  @Post()
  async create(
    @Param('slug') slug: string,
    @Body() body: { name: string; allowMultiple?: boolean; maxVotes?: number; order?: number },
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.positionsService.create(slug, body.name, body.allowMultiple || false, body.maxVotes || 1, body.order);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; allowMultiple?: boolean; maxVotes?: number; order?: number },
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.positionsService.update(id, body);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.positionsService.remove(id);
  }
}
