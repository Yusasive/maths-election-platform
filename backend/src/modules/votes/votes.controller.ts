import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { VotesService } from './votes.service';

@Controller('elections/:slug/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Param('slug') slug: string,
    @Body() body: { matricNumber: string; votes: Record<string, string | string[]> },
  ) {
    return this.votesService.submitVote(slug, body.matricNumber, body.votes);
  }
}
