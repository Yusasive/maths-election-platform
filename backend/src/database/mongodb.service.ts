import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongodbService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(MongodbService.name);

  async onModuleInit() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');

    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB_NAME || 'votingApp');

    // Log topology events without crashing on transient drops
    this.client.on('close', () => this.logger.warn('MongoDB connection closed — driver will retry'));
    this.client.on('reconnect', () => this.logger.log('MongoDB reconnected'));
    this.client.on('error', (err) => this.logger.error('MongoDB client error', err.message));

    this.logger.log('Connected to MongoDB');
    await this.createIndexes();
  }

  private async createIndexes() {
    const db = this.db;
    await Promise.all([
      db.collection('admins').createIndex({ email: 1 }, { unique: true }),
      db.collection('elections').createIndex({ slug: 1 }, { unique: true }),
      db.collection('elections').createIndex({ adminId: 1 }),
      db.collection('voters').createIndex({ electionSlug: 1, matricNumber: 1 }, { unique: true }),
      db.collection('voters').createIndex({ electionSlug: 1 }),
      db.collection('votes').createIndex({ electionSlug: 1, matricNumber: 1 }),
      db.collection('positions').createIndex({ electionSlug: 1 }),
      db.collection('candidates').createIndex({ positionId: 1 }),
    ]);
    this.logger.log('MongoDB indexes ensured');
  }

  async onModuleDestroy() {
    await this.client?.close();
  }

  getDb(): Db {
    return this.db;
  }

  getFetchDb(): Db {
    return this.client.db(process.env.MONGODB_DB_NAME || 'votingApp');
  }
}
