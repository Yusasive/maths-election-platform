import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VotesService } from './votes.service';

@Controller('elections/:slug/votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // Max 5 vote submissions per minute per IP — allows retries, blocks spam
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Param('slug') slug: string,
    @Body() body: { matricNumber: string; votes: Record<string, string | string[]> },
  ) {
    return this.votesService.submitVote(slug, body.matricNumber, body.votes);
  }
}
