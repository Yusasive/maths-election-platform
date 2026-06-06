import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class CandidatesService {
  constructor(private readonly mongodb: MongodbService) {}

  async listByElection(electionSlug: string) {
    const db = this.mongodb.getDb();
    const [candidates, positions] = await Promise.all([
      db.collection('candidates').find({ electionSlug }).toArray(),
      db.collection('positions').find({ electionSlug }).sort({ order: 1 }).toArray(),
    ]);

    return positions.map((pos) => ({
      ...pos,
      id: pos._id.toString(),
      candidates: candidates
        .filter((c) => c.positionId === pos._id.toString())
        .map((c) => ({ ...c, id: c._id.toString() })),
    }));
  }

  async create(electionSlug: string, body: {
    positionId: string;
    name: string;
    level: string;
    imageUrl: string;
  }) {
    const { positionId, name, level, imageUrl } = body;
    if (!positionId || !name || !level || !imageUrl) {
      throw new BadRequestException('positionId, name, level, and imageUrl are required');
    }

    const db = this.mongodb.getDb();
    const result = await db.collection('candidates').insertOne({
      electionSlug,
      positionId,
      name,
      level,
      imageUrl,
      createdAt: new Date(),
    });

    return { message: 'Candidate added', candidateId: result.insertedId };
  }

  async update(id: string, body: { name?: string; level?: string; imageUrl?: string }) {
    if (!ObjectId.isValid(id)) throw new BadRequestException('Invalid candidate ID');
    const db = this.mongodb.getDb();

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.level !== undefined) update.level = body.level;
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl;

    const result = await db.collection('candidates').updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );
    if (result.matchedCount === 0) throw new NotFoundException('Candidate not found');
    return { message: 'Candidate updated' };
  }

  async remove(id: string) {
    if (!ObjectId.isValid(id)) throw new BadRequestException('Invalid candidate ID');
    const db = this.mongodb.getDb();
    await db.collection('candidates').deleteOne({ _id: new ObjectId(id) });
    return { message: 'Candidate deleted' };
  }
}
