import { Injectable, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';

@Injectable()
export class ResultsService {
  constructor(private readonly mongodb: MongodbService) {}

  async getResults(electionSlug: string) {
    const db = this.mongodb.getDb();

    const election = await db.collection('elections').findOne({ slug: electionSlug });
    if (!election) throw new NotFoundException('Election not found');

    if (election.showLiveResults === false && election.status === 'active') {
      return {
        resultsHidden: true,
        election: { slug: election.slug, title: election.title, status: election.status },
      };
    }

    // Run all data fetches in parallel — single aggregation per collection
    const [voteCounts, totalVotesCast, positions, candidates, totalVoters] = await Promise.all([
      // Unwind the per-position vote arrays and count per candidateId in one pass
      db.collection('votes').aggregate([
        { $match: { electionSlug } },
        { $project: { candidateIds: { $objectToArray: '$votes' } } },
        { $unwind: '$candidateIds' },
        { $unwind: '$candidateIds.v' },
        { $group: { _id: '$candidateIds.v', count: { $sum: 1 } } },
      ]).toArray(),

      db.collection('votes').countDocuments({ electionSlug }),
      db.collection('positions').find({ electionSlug }).sort({ order: 1 }).toArray(),
      db.collection('candidates').find({ electionSlug }).toArray(),
      db.collection('voters').countDocuments({ electionSlug }),
    ]);

    // Build a fast O(1) lookup map from the aggregation result
    const voteCountMap: Record<string, number> = {};
    for (const { _id, count } of voteCounts) {
      voteCountMap[String(_id)] = count;
    }

    const results = positions.map((pos) => {
      const positionCandidates = candidates
        .filter((c) => c.positionId === pos._id.toString())
        .map((c) => ({
          id: c._id.toString(),
          name: c.name,
          level: c.level,
          imageUrl: c.imageUrl,
          votes: voteCountMap[c._id.toString()] || 0,
          ...(c.nickname ? { nickname: c.nickname } : {}),
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
        showLiveResults: election.showLiveResults !== false,
      },
      totalVoters,
      totalVotesCast,
      results,
    };
  }
}
