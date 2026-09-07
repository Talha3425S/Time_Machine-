import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceRecord } from '../entities/evidence-record.entity';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { Incident } from '../entities/incident.entity';
import { ProofReport } from '../entities/proof-report.entity';
import { TestRun } from '../entities/test-run.entity';

type TrialSummary = {
  sampleCount: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number | null;
  confidenceInterval: { lower: number; upper: number } | null;
  isFlaky: boolean;
  recommendedRetries: number;
};

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(Incident) private readonly incidents: Repository<Incident>,
    @InjectRepository(TestRun) private readonly testRuns: Repository<TestRun>,
    @InjectRepository(Hypothesis) private readonly hypotheses: Repository<Hypothesis>,
    @InjectRepository(Experiment) private readonly experiments: Repository<Experiment>,
    @InjectRepository(EvidenceRecord) private readonly evidence: Repository<EvidenceRecord>,
    @InjectRepository(ProofReport) private readonly reports: Repository<ProofReport>,
  ) {}

  async collect(projectId: string, incidentId: string) {
    await this.requireIncident(projectId, incidentId);
    const [runs, hypotheses, experiments, recorded] = await Promise.all([
      this.testRuns.find({ where: { projectId, incidentId }, order: { createdAt: 'ASC' } }),
      this.hypotheses.find({ where: { incidentId }, order: { rank: 'ASC', createdAt: 'ASC' } }),
      this.experiments.createQueryBuilder('experiment').innerJoinAndSelect('experiment.hypothesis', 'hypothesis').where('hypothesis.incidentId = :incidentId', { incidentId }).orderBy('experiment.createdAt', 'ASC').getMany(),
      this.evidence.find({ where: { projectId, incidentId } }),
    ]);
    const existing = new Set(recorded.map((item) => `${item.sourceType}:${item.sourceId}:${item.type}`));
    const additions: EvidenceRecord[] = [];
    const add = (sourceType: EvidenceRecord['sourceType'], sourceId: string, type: EvidenceRecord['type'], claim: string, confidence: number, provenance: Record<string, unknown>, experimentId: string | null = null) => {
      if (!existing.has(`${sourceType}:${sourceId}:${type}`)) additions.push(this.evidence.create({ projectId, incidentId, experimentId, sourceType, sourceId, type, claim, confidence, provenance }));
    };

    for (const run of runs) {
      const outcome = run.passed ? 'passed' : 'failed';
      add('test_run', run.id, 'assertion', `The configured test oracle ${outcome} (exit code ${run.exitCode}).`, 1, { command: run.command, exitCode: run.exitCode, timedOut: run.timedOut, stateId: run.stateId, observedAt: run.createdAt });
      add('test_run', run.id, 'metric', `The test run completed in ${run.durationMs} ms.`, 0.95, { durationMs: run.durationMs, command: run.command, observedAt: run.createdAt });
      if (run.output) add('test_run', run.id, 'log', `Test output artifact captured (${run.output.length} characters).`, 0.9, { artifact: { type: 'test_run_output', sourceId: run.id, length: run.output.length }, observedAt: run.createdAt });
    }
    for (const hypothesis of hypotheses) {
      const confidence = hypothesis.status === 'confirmed' ? 0.9 : hypothesis.status === 'rejected' ? 0.1 : Math.min(0.75, Math.max(0.1, Number(hypothesis.score) / 100));
      add('hypothesis', hypothesis.id, 'assertion', `Hypothesis #${hypothesis.rank}: ${hypothesis.description}`, confidence, { rank: hypothesis.rank, score: Number(hypothesis.score), status: hypothesis.status, suspectedChanges: hypothesis.suspectedChanges, evidence: hypothesis.evidence, observedAt: hypothesis.createdAt });
    }
    for (const experiment of experiments) {
      const result = experiment.result || {};
      const outcome = result.success === true ? 'passed' : result.success === false ? 'failed' : 'has not recorded an oracle result';
      add('experiment', experiment.id, 'assertion', `Planned experiment ${outcome}.`, result.success === undefined ? 0.3 : 0.95, { status: experiment.status, intervention: experiment.intervention, estimatedCost: Number(experiment.estimatedCost), actualCost: experiment.actualCost == null ? null : Number(experiment.actualCost), result, observedAt: experiment.completedAt || experiment.createdAt }, experiment.id);
    }
    if (additions.length) await this.evidence.save(additions);
    return this.list(projectId, incidentId);
  }

  async list(projectId: string, incidentId: string) {
    await this.requireIncident(projectId, incidentId);
    return this.evidence.find({ where: { projectId, incidentId }, order: { createdAt: 'ASC' } });
  }

  async history(projectId: string, incidentId: string) {
    const [evidence, trials] = await Promise.all([this.list(projectId, incidentId), this.getTrialSummary(projectId, incidentId)]);
    return { evidence, trials };
  }

  async getTrialSummary(projectId: string, incidentId: string): Promise<TrialSummary> {
    await this.requireIncident(projectId, incidentId);
    const runs = await this.testRuns.find({ where: { projectId, incidentId }, order: { createdAt: 'ASC' } });
    const sampleCount = runs.length;
    const successfulRuns = runs.filter((run) => run.passed).length;
    const failedRuns = sampleCount - successfulRuns;
    if (sampleCount === 0) return { sampleCount, successfulRuns, failedRuns, successRate: null, confidenceInterval: null, isFlaky: false, recommendedRetries: 0 };
    const successRate = successfulRuns / sampleCount;
    const z = 1.96;
    const denominator = 1 + (z * z) / sampleCount;
    const center = (successRate + (z * z) / (2 * sampleCount)) / denominator;
    const margin = z * Math.sqrt((successRate * (1 - successRate) + (z * z) / (4 * sampleCount)) / sampleCount) / denominator;
    const isFlaky = sampleCount >= 2 && successfulRuns > 0 && failedRuns > 0;
    return { sampleCount, successfulRuns, failedRuns, successRate, confidenceInterval: { lower: Math.max(0, center - margin), upper: Math.min(1, center + margin) }, isFlaky, recommendedRetries: isFlaky ? Math.min(5, Math.max(2, Math.ceil(sampleCount * 1.5))) : 0 };
  }

  async generateReport(projectId: string, incidentId: string) {
    const incident = await this.requireIncident(projectId, incidentId);
    await this.collect(projectId, incidentId);
    const [evidence, hypotheses, experiments, trials] = await Promise.all([
      this.list(projectId, incidentId),
      this.hypotheses.find({ where: { incidentId }, order: { rank: 'ASC', createdAt: 'ASC' } }),
      this.experiments.createQueryBuilder('experiment').innerJoin('experiment.hypothesis', 'hypothesis').where('hypothesis.incidentId = :incidentId', { incidentId }).orderBy('experiment.createdAt', 'ASC').getMany(),
      this.getTrialSummary(projectId, incidentId),
    ]);
    const confirmed = hypotheses.find((hypothesis) => hypothesis.status === 'confirmed');
    const candidate = confirmed || hypotheses.find((hypothesis) => hypothesis.status !== 'rejected');
    const completed = experiments.filter((experiment) => experiment.status === 'completed');
    const successfulExperiments = completed.filter((experiment) => experiment.result?.success === true);
    const hasDeterministicSupport = Boolean(confirmed && successfulExperiments.length && !trials.isFlaky);
    const limitations: string[] = [];
    if (!candidate) limitations.push('No active hypothesis has been generated for this incident.');
    if (!hasDeterministicSupport) limitations.push('The leading hypothesis is a candidate, not a deterministic proof.');
    if (!trials.sampleCount) limitations.push('No oracle test runs are linked to this incident.');
    if (!successfulExperiments.length) limitations.push('No successful controlled experiment result is linked to this incident.');
    if (trials.isFlaky) limitations.push(`Mixed oracle outcomes were detected; run at least ${trials.recommendedRetries} additional trials before confirming a cause.`);
    if (incident.status !== 'resolved') limitations.push('No verified repair has been recorded.');
    const baseConfidence = hasDeterministicSupport ? 0.9 : candidate ? Math.min(0.6, Math.max(0.15, Number(candidate.score) / 100 * 0.6)) : 0;
    const confidence = Number((trials.isFlaky ? baseConfidence * 0.55 : baseConfidence).toFixed(4));
    const report = this.reports.create({
      projectId,
      incidentId,
      rootCause: candidate ? (hasDeterministicSupport ? candidate.description : `Unconfirmed candidate: ${candidate.description}`) : 'No root-cause candidate is available.',
      confidence,
      supportingExperimentIds: successfulExperiments.map((experiment) => experiment.id),
      supportingEvidenceIds: evidence.map((item) => item.id),
      citations: evidence.map((item) => ({ evidenceId: item.id, sourceType: item.sourceType, sourceId: item.sourceId, claim: item.claim })),
      verifiedRepair: null,
      limitations,
      trialSummary: trials,
    });
    return this.reports.save(report);
  }

  async listReports(projectId: string, incidentId: string) {
    await this.requireIncident(projectId, incidentId);
    return this.reports.find({ where: { projectId, incidentId }, order: { createdAt: 'DESC' } });
  }

  private async requireIncident(projectId: string, incidentId: string) {
    const incident = await this.incidents.findOne({ where: { id: incidentId, projectId } });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }
}
