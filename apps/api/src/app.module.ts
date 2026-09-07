import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { GithubModule } from './github/github.module';
import { AgentModule } from './agent/agent.module';
import { SemanticModule } from './semantic/semantic.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { PlanningModule } from './planning/planning.module';
import { EvidenceModule } from './evidence/evidence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    OrganizationsModule,
    GithubModule,
    AgentModule,
    SemanticModule,
    ExperimentsModule,
    PlanningModule,
    EvidenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
