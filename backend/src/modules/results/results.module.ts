import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongodbService } from '../../database/mongodb.service';

@Module({
  controllers: [ResultsController],
  providers: [ResultsService, MongodbService],
})
export class ResultsModule {}
