import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { VotesModule } from './modules/votes/votes.module';
import { ResultsModule } from './modules/results/results.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { ElectionsModule } from './modules/elections/elections.module';
import { PositionsModule } from './modules/positions/positions.module';

@Module({
  imports: [
    AdminModule,
    ElectionsModule,
    PositionsModule,
    CandidatesModule,
    AuthModule,
    VotesModule,
    ResultsModule,
    UploadModule,
  ],
})
export class AppModule {}
