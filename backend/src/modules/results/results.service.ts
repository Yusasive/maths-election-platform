import { Injectable, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';

@Injectable()
export class ResultsService {
  constructor(private readonly mongodb: MongodbService) {}

  async getResults(electionSlug: string) {
    const db = this.mongodb.getDb();

    const election = await db.collection('elections').findOne({ slug: electionSlug });
    if (!election) throw new NotFoundException('Election not found');

    const [votes, positions, candidates] = await Promise.all([
      db.collection('votes').find({ electionSlug }).toArray(),
      db.collection('positions').find({ electionSlug }).sort({ order: 1 }).toArray(),
      db.collection('candidates').find({ electionSlug }).toArray(),
    ]);

    // Count votes per candidate
    const voteCounts: Record<string, number> = {};
    for (const vote of votes) {
      for (const [, candidateIds] of Object.entries(vote.votes || {})) {
        const ids = Array.isArray(candidateIds) ? candidateIds : [candidateIds];
        for (const id of ids) {
          voteCounts[id] = (voteCounts[id] || 0) + 1;
        }
      }
    }

    const totalVoters = await db.collection('voters').countDocuments({ electionSlug });

    const results = positions.map((pos) => {
      const positionCandidates = candidates
        .filter((c) => c.positionId === pos._id.toString())
        .map((c) => ({
          id: c._id.toString(),
          name: c.name,
          level: c.level,
          imageUrl: c.imageUrl,
          votes: voteCounts[c._id.toString()] || 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      return {
        positionId: pos._id.toString(),
        position: pos.name,
        allowMultiple: pos.allowMultiple,
        candidates: positionCandidates,
      };
    });

    return {
      election: {
        slug: election.slug,
        title: election.title,
        status: election.status,
        votingEndTime: election.votingEndTime,
      },
      totalVoters,
      totalVotesCast: votes.length,
      results,
    };
  }
}
