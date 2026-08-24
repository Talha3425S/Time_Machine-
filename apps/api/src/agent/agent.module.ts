import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentStateService } from './agent-state.service';
import { AgentStateController, StatesController } from './agent-state.controller';
import { AgentState } from '../entities/agent-state.entity';
import { Project } from '../entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentState, Project])],
  controllers: [AgentStateController, StatesController],
  providers: [AgentStateService],
  exports: [AgentStateService],
})
export class AgentModule {}
