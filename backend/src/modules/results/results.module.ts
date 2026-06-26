import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MongodbService } from '../../database/mongodb.service';
import { AdminService } from '../admin/admin.service';

@Module({
  controllers: [ResultsController],
  providers: [ResultsService, AdminService, MongodbService],
})
export class ResultsModule {}
