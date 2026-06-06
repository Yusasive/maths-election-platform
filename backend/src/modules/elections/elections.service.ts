import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';
import { ObjectId } from 'mongodb';

interface CacheEntry { data: unknown; ts: number }

@Injectable()
export class ElectionsService {
  constructor(private readonly mongodb: MongodbService) {}

  // Simple in-memory cache for high-read endpoints
  private readonly cache = new Map<string, CacheEntry>();
  private readonly SLUG_TTL = 30_000;   // election detail — 30 s
  private readonly LIST_TTL = 15_000;   // public list — 15 s

  private cacheGet(key: string, ttl: number): unknown | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < ttl) return entry.data;
    return null;
  }

  private cacheSet(key: string, data: unknown) {
    this.cache.set(key, { data, ts: Date.now() });
  }

  private cacheInvalidate(slug: string) {
    this.cache.delete(`slug:${slug}`);
    this.cache.delete('list:public');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async listPublic() {
    const cached = this.cacheGet('list:public', this.LIST_TTL);
    if (cached) return cached;

    const db = this.mongodb.getDb();
    const result = await db
      .collection('elections')
      .find(
        { status: { $in: ['active', 'closed'] }, isPublic: { $ne: false } },
        { projection: { adminId: 0, accessCode: 0 } },
      )
      .sort({ createdAt: -1 })
      .toArray();

    this.cacheSet('list:public', result);
    return result;
  }

  async listAll() {
    const db = this.mongodb.getDb();
    return db.collection('elections').find({}).sort({ createdAt: -1 }).toArray();
  }

  async listByAdmin(adminId: string) {
    const db = this.mongodb.getDb();
    const elections = await db
      .collection('elections')
      .find({ adminId })
      .sort({ createdAt: -1 })
      .toArray();

    // Attach mini stats (voter + vote count) to each election in parallel
    const withStats = await Promise.all(
      elections.map(async (e) => {
        const [voterCount, voteCount] = await Promise.all([
          db.collection('voters').countDocuments({ electionSlug: e.slug }),
          db.collection('votes').countDocuments({ electionSlug: e.slug }),
        ]);
        return { ...e, voterCount, voteCount };
      }),
    );
    return withStats;
  }

  async getBySlug(slug: string) {
    const cached = this.cacheGet(`slug:${slug}`, this.SLUG_TTL);
    if (cached) return cached;

    const db = this.mongodb.getDb();
    const election = await db.collection('elections').findOne({ slug });
    if (!election) throw new NotFoundException(`Election "${slug}" not found`);
    const { accessCode, ...rest } = election;
    const result = { ...rest, hasAccessCode: !!accessCode };

    this.cacheSet(`slug:${slug}`, result);
    return result;
  }

  async create(adminId: string, body: {
    title: string;
    description?: string;
    logoUrl?: string;
    status?: string;
    accessCode?: string;
    isPublic?: boolean;
    votingStartTime: string;
    votingEndTime: string;
    slug?: string;
  }) {
    const { title, description, logoUrl, votingStartTime, votingEndTime } = body;
    if (!title || !votingStartTime || !votingEndTime) {
      throw new BadRequestException('title, votingStartTime, and votingEndTime are required');
    }

    const db = this.mongodb.getDb();
    const slug = body.slug ? this.slugify(body.slug) : this.slugify(title);
    if (!slug) throw new BadRequestException('Could not generate a valid slug from the title');

    const existing = await db.collection('elections').findOne({ slug });
    if (existing) throw new BadRequestException(`Slug "${slug}" is already in use`);

    const result = await db.collection('elections').insertOne({
      slug,
      title,
      description: description || '',
      logoUrl: logoUrl || '',
      adminId,
      status: body.status === 'draft' ? 'draft' : 'active',
      accessCode: body.accessCode?.trim() || '',
      isPublic: body.isPublic !== false,
      votingStartTime: new Date(votingStartTime),
      votingEndTime: new Date(votingEndTime),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.cache.delete('list:public');
    return { message: 'Election created', electionId: result.insertedId, slug };
  }

  async update(slug: string, adminId: string, role: string, body: {
    title?: string;
    description?: string;
    logoUrl?: string;
    status?: string;
    accessCode?: string;
    isPublic?: boolean;
    votingStartTime?: string;
    votingEndTime?: string;
  }) {
    const db = this.mongodb.getDb();
    const election = await db.collection('elections').findOne({ slug });
    if (!election) throw new NotFoundException('Election not found');

    if (role !== 'super_admin' && election.adminId !== adminId) {
      throw new ForbiddenException('You do not own this election');
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.logoUrl !== undefined) update.logoUrl = body.logoUrl;
    if (body.status !== undefined) update.status = body.status;
    if (body.votingStartTime !== undefined) update.votingStartTime = new Date(body.votingStartTime);
    if (body.votingEndTime !== undefined) update.votingEndTime = new Date(body.votingEndTime);
    if (body.accessCode !== undefined) update.accessCode = body.accessCode.trim();
    if (body.isPublic !== undefined) update.isPublic = body.isPublic;

    await db.collection('elections').updateOne({ slug }, { $set: update });
    this.cacheInvalidate(slug);
    return { message: 'Election updated' };
  }

  async remove(slug: string, adminId: string, role: string) {
    const db = this.mongodb.getDb();
    const election = await db.collection('elections').findOne({ slug });
    if (!election) throw new NotFoundException('Election not found');

    if (role !== 'super_admin' && election.adminId !== adminId) {
      throw new ForbiddenException('You do not own this election');
    }

    await db.collection('elections').deleteOne({ slug });
    await db.collection('positions').deleteMany({ electionSlug: slug });
    await db.collection('candidates').deleteMany({ electionSlug: slug });
    await db.collection('voters').deleteMany({ electionSlug: slug });
    await db.collection('votes').deleteMany({ electionSlug: slug });
    this.cacheInvalidate(slug);

    return { message: 'Election and all related data deleted' };
  }

  async getStats(slug: string) {
    const db = this.mongodb.getDb();
    const [voters, votes, candidates, positions] = await Promise.all([
      db.collection('voters').countDocuments({ electionSlug: slug }),
      db.collection('votes').countDocuments({ electionSlug: slug }),
      db.collection('candidates').countDocuments({ electionSlug: slug }),
      db.collection('positions').countDocuments({ electionSlug: slug }),
    ]);
    return { voters, votes, candidates, positions, turnout: voters > 0 ? Math.round((votes / voters) * 100) : 0 };
  }
}
