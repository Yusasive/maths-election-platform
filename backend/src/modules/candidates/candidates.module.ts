import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { MongodbService } from '../../database/mongodb.service';
import { AdminService } from '../admin/admin.service';

@Module({
  controllers: [CandidatesController],
  providers: [CandidatesService, AdminService, MongodbService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
