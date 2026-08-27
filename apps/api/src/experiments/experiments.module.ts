import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { SandboxExecution } from '../entities/sandbox-execution.entity';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { DockerSandboxAdapter } from './sandbox.adapter';

@Module({ imports: [TypeOrmModule.forFeature([Project, SandboxExecution])], controllers: [ExperimentsController], providers: [ExperimentsService, DockerSandboxAdapter] })
export class ExperimentsModule {}
