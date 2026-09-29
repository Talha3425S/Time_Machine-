import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceRecord } from '../entities/evidence-record.entity';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { Incident } from '../entities/incident.entity';
import { ProofReport } from '../entities/proof-report.entity';
import { TestRun } from '../entities/test-run.entity';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, TestRun, Hypothesis, Experiment, EvidenceRecord, ProofReport])],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
