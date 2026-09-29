import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentStateService } from './agent-state.service';
import { AgentStateController, StatesController } from './agent-state.controller';
import { AgentState } from '../entities/agent-state.entity';
import { Project } from '../entities/project.entity';
import { Incident } from '../entities/incident.entity';
import { Baseline } from '../entities/baseline.entity';
import { TestRun } from '../entities/test-run.entity';
import { OracleService } from './oracle.service';
import { SemanticModule } from '../semantic/semantic.module';
import { EvidenceModule } from '../evidence/evidence.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentState, Project, Incident, Baseline, TestRun]), SemanticModule, EvidenceModule],
  controllers: [AgentStateController, StatesController],
  providers: [AgentStateService, OracleService],
  exports: [AgentStateService],
})
export class AgentModule {}
