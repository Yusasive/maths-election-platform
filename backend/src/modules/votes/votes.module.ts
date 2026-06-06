import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { MongodbService } from '../../database/mongodb.service';

@Module({
  controllers: [VotesController],
  providers: [VotesService, MongodbService],
})
export class VotesModule {}
