import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { relative, resolve } from 'path';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { SandboxExecution } from '../entities/sandbox-execution.entity';
import { DockerSandboxAdapter } from './sandbox.adapter';

export interface CreateExperimentInput { command?: string; workspacePath: string; candidateBranch?: string; baselineRef?: string; allowNetwork?: boolean; }

@Injectable()
export class ExperimentsService {
  constructor(@InjectRepository(Project) private readonly projects: Repository<Project>, @InjectRepository(SandboxExecution) private readonly executions: Repository<SandboxExecution>, private readonly sandbox: DockerSandboxAdapter) {}

  async create(projectId: string, input: CreateExperimentInput) {
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const command = input.command?.trim() || project.defaultTestCommand;
    if (!command) throw new BadRequestException('A test command is required');
    const workspacePath = this.workspace(input.workspacePath);
    const sandboxName = `stm-${randomUUID().slice(0, 12)}`;
    const execution = await this.executions.save(this.executions.create({ projectId, sandboxName, workspacePath, command, candidateBranch: input.candidateBranch ?? null, baselineRef: input.baselineRef ?? 'HEAD', allowNetwork: input.allowNetwork === true, isolation: { cloneMode: true, network: input.allowNetwork ? 'enabled-by-request' : 'deny-all', hostWorkspace: 'read-only' }, output: null, error: null }));
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
    return this.executions.save(execution);
  }

  async restore(id: string) { const execution = await this.get(id); execution.status = 'restoring'; await this.executions.save(execution); try { await this.sandbox.restore(execution.sandboxName, execution.baselineRef || 'HEAD'); execution.status = 'ready'; execution.error = null; } catch (error: any) { execution.status = 'failed'; execution.error = String(error?.message || error); } return this.executions.save(execution); }
  async remove(id: string) { const execution = await this.get(id); await this.sandbox.remove(execution.sandboxName); execution.status = 'cleaned'; return this.executions.save(execution); }
  async list(projectId: string) { return this.executions.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async get(id: string) { const execution = await this.executions.findOne({ where: { id } }); if (!execution) throw new NotFoundException('Experiment not found'); return execution; }
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
