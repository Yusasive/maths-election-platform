import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { AdminService } from '../admin/admin.service';

@Controller('elections/:slug/candidates')
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async list(@Param('slug') slug: string) {
    return this.candidatesService.listByElection(slug);
  }

  @Post()
  async create(
    @Param('slug') slug: string,
    @Body() body: { positionId: string; name: string; level: string; imageUrl: string },
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.candidatesService.create(slug, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; level?: string; imageUrl?: string },
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.candidatesService.update(id, body);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    await this.adminService.validateAdmin(auth);
    return this.candidatesService.remove(id);
  }
}
