import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AgentState } from '../entities/agent-state.entity';
import { Baseline } from '../entities/baseline.entity';
import { Incident } from '../entities/incident.entity';
import { Project } from '../entities/project.entity';
import { TestRun } from '../entities/test-run.entity';

export interface OraclePayload {
  command: string; passed: boolean; exitCode?: number; output?: string;
  durationMs?: number; timedOut?: boolean; executedAt?: string; state?: Record<string, unknown>;
}

@Injectable()
export class OracleService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(AgentState) private readonly states: Repository<AgentState>,
    @InjectRepository(Baseline) private readonly baselines: Repository<Baseline>,
    @InjectRepository(TestRun) private readonly testRuns: Repository<TestRun>,
    @InjectRepository(Incident) private readonly incidents: Repository<Incident>,
  ) {}

  async record(projectId: string, payload: OraclePayload) {
    if (!payload.command?.trim()) throw new Error('A test command is required');
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const state = payload.state ? await this.states.save(this.states.create({
      projectId, gitState: payload.state.git ?? null, phpState: payload.state.php ?? null,
      composerState: payload.state.composer ?? null, dockerState: payload.state.docker ?? null,
      environmentState: payload.state.env ?? null, fullState: payload.state,
      collectionTrigger: payload.passed ? 'baseline' : 'failure',
      metadata: { source: 'oracle', executedAt: payload.executedAt },
    })) : null;
    const run = await this.testRuns.save(this.testRuns.create({
      projectId, command: payload.command, passed: payload.passed, exitCode: payload.exitCode ?? (payload.passed ? 0 : 1),
      output: this.trimOutput(payload.output), durationMs: payload.durationMs ?? 0, timedOut: payload.timedOut ?? false, stateId: state?.id ?? null,
    }));
    if (payload.passed) {
      const baseline = await this.baselines.save(this.baselines.create({
        projectId, command: payload.command, stateId: state?.id ?? null,
        result: { exitCode: run.exitCode, durationMs: run.durationMs, createdFromRunId: run.id },
        fingerprint: this.fingerprint(payload.state),
      }));
      return { outcome: 'baseline_created', baseline, run };
    }
    const classification = this.classify(payload.output ?? '', payload.timedOut ?? false);
    const signature = createHash('sha256').update(`${payload.command}:${classification.type}:${classification.summary}`).digest('hex');
    let incident = await this.incidents.findOne({ where: { projectId, failureSignature: signature, status: 'open' } });
    if (!incident) incident = await this.incidents.save(this.incidents.create({
      projectId, title: classification.summary, description: this.trimOutput(payload.output), failureType: classification.type,
      failureSignature: signature, metadata: { command: payload.command, exitCode: run.exitCode, timedOut: run.timedOut, stateId: state?.id },
    }));
    run.incidentId = incident.id; await this.testRuns.save(run);
    return { outcome: 'incident_created', incident, run, classification };
  }

  async incidentsForProject(projectId: string) { return this.incidents.find({ where: { projectId }, order: { updatedAt: 'DESC' } }); }

  private trimOutput(output?: string) { return (output ?? '').slice(-20_000); }
  private fingerprint(state?: Record<string, unknown>) { const git = state?.git as Record<string, unknown> | undefined; return { commit: git?.current_commit, branch: git?.current_branch }; }
  private classify(output: string, timedOut: boolean) {
    if (timedOut) return { type: 'timeout', summary: 'Test command timed out' };
    const patterns: Array<[RegExp, string, string]> = [[/assert(?:ion)?|expected .* (?:to|but)/i, 'assertion', 'Test assertion failed'], [/connection refused|econnrefused/i, 'connection', 'Service connection failed'], [/module not found|class .* not found/i, 'dependency', 'Dependency could not be resolved'], [/syntax error|parse error/i, 'syntax', 'Syntax error detected']];
    const match = patterns.find(([pattern]) => pattern.test(output));
    return match ? { type: match[1], summary: match[2] } : { type: 'test_failure', summary: 'Test command failed' };
  }
}
