import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';

@Injectable()
export class VotesService {
  constructor(private readonly mongodb: MongodbService) {}

  async submitVote(
    electionSlug: string,
    matricNumber: string,
    votes: Record<string, string | string[]>,
  ) {
    if (!matricNumber || !votes) throw new BadRequestException('Invalid input data');

    const db = this.mongodb.getDb();

    const election = await db.collection('elections').findOne({ slug: electionSlug });
    if (!election) throw new NotFoundException('Election not found');
    if (election.status === 'closed') throw new BadRequestException('This election is closed');

    const now = new Date();
    const start = new Date(election.votingStartTime);
    const end = new Date(election.votingEndTime);
    if (now < start) throw new BadRequestException('Voting has not started yet');
    if (now > end) throw new BadRequestException('Voting period has ended');

    const normalized = matricNumber.trim().toLowerCase();
    const voter = await db.collection('voters').findOne({ electionSlug, matricNumber: normalized });
    if (!voter) throw new BadRequestException('You are not registered for this election');
    if (voter.hasVoted) throw new BadRequestException('You have already voted in this election');

    const alreadyVoted = await db.collection('votes').findOne({ electionSlug, matricNumber: normalized });
    if (alreadyVoted) throw new BadRequestException('You have already voted in this election');

    await db.collection('votes').insertOne({
      electionSlug,
      matricNumber: normalized,
      votes,
      timestamp: new Date(),
    });

    await db.collection('voters').updateOne(
      { electionSlug, matricNumber: normalized },
      { $set: { hasVoted: true } },
    );

    return { message: 'Vote successfully recorded' };
  }
}
