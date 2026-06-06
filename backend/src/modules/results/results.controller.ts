import { Controller, Get, Param } from '@nestjs/common';
import { ResultsService } from './results.service';

@Controller('elections/:slug/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async getResults(@Param('slug') slug: string) {
    return this.resultsService.getResults(slug);
  }
}
