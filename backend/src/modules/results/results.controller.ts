import { Controller, Get, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { ResultsService } from './results.service';
import { AdminService } from '../admin/admin.service';

@Controller('elections/:slug/results')
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async getResults(@Param('slug') slug: string) {
    return this.resultsService.getResults(slug);
  }

  @Get('admin')
  async getResultsAdmin(
    @Param('slug') slug: string,
    @Headers('authorization') auth: string,
  ) {
    try {
      await this.adminService.validateAdmin(auth);
    } catch {
      throw new UnauthorizedException('Admin authentication required');
    }
    return this.resultsService.getResults(slug, true);
  }
}
