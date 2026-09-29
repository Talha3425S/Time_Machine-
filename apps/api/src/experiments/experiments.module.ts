import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { SandboxExecution } from '../entities/sandbox-execution.entity';
import { EvidenceModule } from '../evidence/evidence.module';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { DockerSandboxAdapter } from './sandbox.adapter';

@Module({ imports: [TypeOrmModule.forFeature([Project, SandboxExecution, Experiment, Hypothesis]), EvidenceModule], controllers: [ExperimentsController], providers: [ExperimentsService, DockerSandboxAdapter] })
export class ExperimentsModule {}
