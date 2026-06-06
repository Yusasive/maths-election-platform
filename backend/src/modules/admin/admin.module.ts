import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongodbService } from '../../database/mongodb.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, MongodbService],
})
export class AdminModule {}
