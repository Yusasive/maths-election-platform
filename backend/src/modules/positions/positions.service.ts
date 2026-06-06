import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class PositionsService {
  constructor(private readonly mongodb: MongodbService) {}

  async list(electionSlug: string) {
    const db = this.mongodb.getDb();
    return db
      .collection('positions')
      .find({ electionSlug })
      .sort({ order: 1 })
      .toArray();
  }

  async create(electionSlug: string, name: string, allowMultiple: boolean, maxVotes: number, order?: number) {
    if (!name) throw new BadRequestException('Position name is required');
    const db = this.mongodb.getDb();

    const existing = await db.collection('positions').findOne({ electionSlug, name });
    if (existing) throw new BadRequestException('A position with this name already exists in this election');

    const count = await db.collection('positions').countDocuments({ electionSlug });
    const result = await db.collection('positions').insertOne({
      electionSlug,
      name,
      allowMultiple: !!allowMultiple,
      maxVotes: allowMultiple ? (maxVotes || 2) : 1,
      order: order !== undefined ? order : count,
      createdAt: new Date(),
    });

    return { message: 'Position created', positionId: result.insertedId };
  }

  async update(id: string, body: { name?: string; allowMultiple?: boolean; maxVotes?: number; order?: number }) {
    if (!ObjectId.isValid(id)) throw new BadRequestException('Invalid position ID');
    const db = this.mongodb.getDb();

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.allowMultiple !== undefined) update.allowMultiple = body.allowMultiple;
    if (body.maxVotes !== undefined) update.maxVotes = body.maxVotes;
    if (body.order !== undefined) update.order = body.order;

    const result = await db.collection('positions').updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );
    if (result.matchedCount === 0) throw new NotFoundException('Position not found');
    return { message: 'Position updated' };
  }

  async remove(id: string) {
    if (!ObjectId.isValid(id)) throw new BadRequestException('Invalid position ID');
    const db = this.mongodb.getDb();
    await db.collection('positions').deleteOne({ _id: new ObjectId(id) });
    await db.collection('candidates').deleteMany({ positionId: id });
    return { message: 'Position and its candidates deleted' };
  }
}
