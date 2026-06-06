import { Module } from '@nestjs/common';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { MongodbService } from '../../database/mongodb.service';
import { AdminService } from '../admin/admin.service';

@Module({
  controllers: [PositionsController],
  providers: [PositionsService, AdminService, MongodbService],
  exports: [PositionsService],
})
export class PositionsModule {}
