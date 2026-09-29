import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { relative, resolve } from 'path';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { SandboxExecution } from '../entities/sandbox-execution.entity';
import { EvidenceService } from '../evidence/evidence.service';
import { DockerSandboxAdapter } from './sandbox.adapter';

export interface CreateExperimentInput { command?: string; workspacePath: string; candidateBranch?: string; baselineRef?: string; allowNetwork?: boolean; plannedExperimentId?: string; }

@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(SandboxExecution) private readonly executions: Repository<SandboxExecution>,
    @InjectRepository(Experiment) private readonly plannedExperiments: Repository<Experiment>,
    @InjectRepository(Hypothesis) private readonly hypotheses: Repository<Hypothesis>,
    private readonly sandbox: DockerSandboxAdapter,
    private readonly evidence: EvidenceService,
  ) {}

  async create(projectId: string, input: CreateExperimentInput) {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const plannedExperiment = input.plannedExperimentId ? await this.requirePlannedExperiment(projectId, input.plannedExperimentId) : null;
    const command = input.command?.trim() || project.defaultTestCommand;
    if (!command) throw new BadRequestException('A test command is required');
    const workspacePath = this.workspace(input.workspacePath);
    const sandboxName = `stm-${randomUUID().slice(0, 12)}`;
    const execution = await this.executions.save(this.executions.create({ projectId, sandboxName, workspacePath, command, plannedExperimentId: plannedExperiment?.id ?? null, candidateBranch: input.candidateBranch ?? null, baselineRef: input.baselineRef ?? 'HEAD', allowNetwork: input.allowNetwork === true, isolation: { cloneMode: true, network: input.allowNetwork ? 'enabled-by-request' : 'deny-all', hostWorkspace: 'read-only', plannedIntervention: plannedExperiment?.intervention ?? null }, output: null, error: null }));
    if (plannedExperiment) {
      plannedExperiment.status = 'running';
      await this.plannedExperiments.save(plannedExperiment);
    }
    this.run(execution.id).catch(() => undefined);
    return execution;
  }

  async run(id: string) {
    const execution = await this.get(id);
    try {
      await this.sandbox.create(execution.sandboxName, execution.workspacePath, execution.allowNetwork);
      execution.status = 'ready'; await this.executions.save(execution);
      if (execution.candidateBranch) {
        const branch = await this.sandbox.execute(execution.sandboxName, `git checkout -B ${this.safeRef(execution.candidateBranch)} ${this.safeRef(execution.baselineRef || 'HEAD')}`);
        if (branch.exitCode !== 0) throw new BadRequestException(`Unable to create candidate branch: ${branch.output}`);
      }
      execution.status = 'running'; execution.startedAt = new Date(); await this.executions.save(execution);
      const result = await this.sandbox.execute(execution.sandboxName, execution.command);
      execution.output = result.output.slice(-20_000); execution.passed = result.exitCode === 0; execution.status = 'completed'; execution.completedAt = new Date();
    } catch (error: any) {
      execution.error = String(error?.message || error).slice(-20_000); execution.status = 'failed'; execution.completedAt = new Date();
    }
    const saved = await this.executions.save(execution);
    await this.recordPlannedResult(saved);
    return saved;
  }

  async restore(id: string) { const execution = await this.get(id); execution.status = 'restoring'; await this.executions.save(execution); try { await this.sandbox.restore(execution.sandboxName, execution.baselineRef || 'HEAD'); execution.status = 'ready'; execution.error = null; } catch (error: any) { execution.status = 'failed'; execution.error = String(error?.message || error); } return this.executions.save(execution); }
  async remove(id: string) { const execution = await this.get(id); await this.sandbox.remove(execution.sandboxName); execution.status = 'cleaned'; return this.executions.save(execution); }
  async list(projectId: string) { return this.executions.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async listPlanned(projectId: string) {
    return this.plannedExperiments.createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.hypothesis', 'hypothesis')
      .innerJoin('hypothesis.incident', 'incident')
      .where('incident.projectId = :projectId', { projectId })
      .andWhere('experiment.status IN (:...statuses)', { statuses: ['pending', 'running'] })
      .orderBy('experiment.createdAt', 'ASC')
      .getMany();
  }
  async get(id: string) { const execution = await this.executions.findOne({ where: { id } }); if (!execution) throw new NotFoundException('Experiment not found'); return execution; }

  private async requirePlannedExperiment(projectId: string, plannedExperimentId: string) {
    const experiment = await this.plannedExperiments.createQueryBuilder('experiment')
      .innerJoinAndSelect('experiment.hypothesis', 'hypothesis')
      .innerJoin('hypothesis.incident', 'incident')
      .where('experiment.id = :plannedExperimentId', { plannedExperimentId })
      .andWhere('incident.projectId = :projectId', { projectId })
      .getOne();
    if (!experiment) throw new NotFoundException('Planned experiment not found for this project');
    if (experiment.status !== 'pending') throw new BadRequestException('This planned experiment has already been started');
    return experiment;
  }

  private async recordPlannedResult(execution: SandboxExecution) {
    if (!execution.plannedExperimentId) return;
    const experiment = await this.plannedExperiments.findOne({ where: { id: execution.plannedExperimentId }, relations: { hypothesis: { incident: true } } });
    if (!experiment) return;
    const durationMs = execution.startedAt && execution.completedAt ? Math.max(0, execution.completedAt.getTime() - execution.startedAt.getTime()) : 0;
    const succeeded = execution.status === 'completed' && execution.passed;
    experiment.status = execution.status === 'completed' ? 'completed' : 'failed';
    experiment.actualCost = Number(experiment.estimatedCost);
    experiment.completedAt = execution.completedAt || new Date();
    experiment.result = {
      success: succeeded,
      output: execution.output || '',
      error: execution.error || undefined,
      executionTime: durationMs,
      evidence: [{ type: 'assertion', value: `Sandbox oracle ${succeeded ? 'passed' : 'failed'} for ${execution.sandboxName}.`, confidence: execution.status === 'completed' ? 1 : 0.4 }],
      sandboxExecutionId: execution.id,
      sandboxStatus: execution.status,
    };
    await this.plannedExperiments.save(experiment);

    if (execution.status === 'completed') {
      experiment.hypothesis.status = succeeded ? 'confirmed' : 'rejected';
      await this.hypotheses.save(experiment.hypothesis);
    }

    const incident = experiment.hypothesis.incident;
    try {
      await this.evidence.refreshForTrial(execution.projectId, incident.id);
    } catch {
      // The sandbox result remains durable even if a later report refresh fails.
    }
  }
  private safeRef(ref: string) { if (!/^[A-Za-z0-9._/^-]+$/.test(ref)) throw new BadRequestException('Invalid candidate branch'); return ref; }
  private workspace(path: string) {
    if (!path?.trim()) throw new BadRequestException('A local workspace path is required');
    const root = resolve(process.env.SANDBOX_WORKSPACE_ROOT || process.cwd());
    const workspace = resolve(path);
    const traversal = relative(root, workspace);
    if (traversal.startsWith('..') || relative(root, workspace) === '') throw new BadRequestException('Workspace must be a repository beneath SANDBOX_WORKSPACE_ROOT');
    if (!existsSync(resolve(workspace, '.git'))) throw new BadRequestException('Workspace must be a Git repository');
    return workspace;
  }
}
