import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { Incident } from '../entities/incident.entity';
import { StateGraph } from '../entities/state-graph.entity';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

@Module({ imports: [TypeOrmModule.forFeature([Incident, Hypothesis, Experiment, StateGraph])], controllers: [PlanningController], providers: [PlanningService] })
export class PlanningModule {}
