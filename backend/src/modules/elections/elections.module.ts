import { Module } from '@nestjs/common';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';
import { MongodbService } from '../../database/mongodb.service';
import { AdminService } from '../admin/admin.service';

@Module({
  controllers: [ElectionsController],
  providers: [ElectionsService, AdminService, MongodbService],
  exports: [ElectionsService],
})
export class ElectionsModule {}
