import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
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
import { SandboxExecution } from '../entities/sandbox-execution.entity';
import { EvidenceRecord } from '../entities/evidence-record.entity';
import { ProofReport } from '../entities/proof-report.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const shouldUseSsl = configService.get('DATABASE_SSL') === 'true';
        const sharedOptions: TypeOrmModuleOptions = {
          type: 'postgres',
          entities: [User, Organization, Project, Incident, StateManifest, Hypothesis, Experiment, OrganizationMember, AgentState, Baseline, TestRun, StateGraph, StateGraphNode, StateGraphEdge, SandboxExecution, EvidenceRecord, ProofReport],
          migrations: [join(__dirname, '..', 'migrations', '*.{js,ts}')],
          migrationsRun: configService.get('RUN_MIGRATIONS') === 'true',
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
          ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        };

        if (databaseUrl) {
          return { ...sharedOptions, url: databaseUrl };
        }

        return {
          ...sharedOptions,
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: Number(configService.get<string>('DATABASE_PORT', '5432')),
          username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
          database: configService.get<string>('DATABASE_NAME', 'software_time_machine'),
        };
      },
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
      SandboxExecution,
      EvidenceRecord,
      ProofReport,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
