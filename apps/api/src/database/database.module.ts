import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { Incident } from '../entities/incident.entity';
import { StateManifest } from '../entities/state-manifest.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { Experiment } from '../entities/experiment.entity';
import { OrganizationMember } from '../entities/organization-member.entity';
import { AgentState } from '../entities/agent-state.entity';
import { Baseline } from '../entities/baseline.entity';
import { TestRun } from '../entities/test-run.entity';
import { StateGraph, StateGraphEdge, StateGraphNode } from '../entities/state-graph.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'software_time_machine'),
        entities: [User, Organization, Project, Incident, StateManifest, Hypothesis, Experiment, OrganizationMember, AgentState, Baseline, TestRun, StateGraph, StateGraphNode, StateGraphEdge],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Organization,
      Project,
      Incident,
      StateManifest,
      Hypothesis,
      Experiment,
      OrganizationMember,
      AgentState,
      Baseline,
      TestRun,
      StateGraph,
      StateGraphNode,
      StateGraphEdge,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
