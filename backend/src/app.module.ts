import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { VotesModule } from './modules/votes/votes.module';
import { ResultsModule } from './modules/results/results.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { ElectionsModule } from './modules/elections/elections.module';
import { PositionsModule } from './modules/positions/positions.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // 60 requests per minute per IP across all endpoints by default
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AdminModule,
    ElectionsModule,
    PositionsModule,
    CandidatesModule,
    AuthModule,
    VotesModule,
    ResultsModule,
    UploadModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
