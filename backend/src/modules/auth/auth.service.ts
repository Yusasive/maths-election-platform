import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';

@Injectable()
export class AuthService {
  constructor(private readonly mongodb: MongodbService) {}

  async registerVoter(
    electionSlug: string,
    matricNumber: string,
    fullName: string,
    department: string,
    image: string,
    accessCode?: string,
  ) {
    const db = this.mongodb.getDb();

    const election = await db.collection('elections').findOne({ slug: electionSlug });
    if (!election) throw new NotFoundException('Election not found');
    if (election.status === 'draft') throw new BadRequestException('This election is not open to voters yet');
    if (election.status === 'closed') throw new BadRequestException('This election is closed');

    if (election.accessCode) {
      if (!accessCode || accessCode.trim() !== election.accessCode.trim()) {
        throw new BadRequestException('Invalid access code');
      }
    }

    const now = new Date();
    const votingStart = new Date(election.votingStartTime);
    const votingEnd = new Date(election.votingEndTime);
    if (now < votingStart) throw new BadRequestException('This election has not started yet');
    if (now > votingEnd) throw new BadRequestException('This election has ended');

    const normalized = matricNumber.trim().toLowerCase();
    const existing = await db.collection('voters').findOne({ electionSlug, matricNumber: normalized });
    if (existing) throw new BadRequestException('You are already registered for this election');

    const result = await db.collection('voters').insertOne({
      electionSlug,
      matricNumber: normalized,
      fullName,
      department,
      image,
      hasVoted: false,
      createdAt: new Date(),
    });

    if (!result.acknowledged) throw new Error('Failed to register voter');
    return { message: 'Registration successful!', voterId: result.insertedId };
  }
}
