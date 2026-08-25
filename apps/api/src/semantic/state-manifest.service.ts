import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StateManifest } from '../entities/state-manifest.entity';
import { StateGraphService } from './state-graph.service';

@Injectable()
export class StateManifestService {
  constructor(
    @InjectRepository(StateManifest) private readonly manifests: Repository<StateManifest>,
    private readonly stateGraphService: StateGraphService,
  ) {}

  async createFromAgentState(projectId: string, state: Record<string, any>, metadata: Record<string, any> = {}) {
    const git = state.git ?? {};
    const previous = await this.manifests.findOne({ where: { projectId }, order: { timestamp: 'DESC' } });
    const manifest = await this.manifests.save(this.manifests.create({
      projectId,
      gitCommit: git.current_commit || 'unknown',
      gitBranch: git.current_branch || 'unknown',
      environment: { system: state.env?.system_env, variables: state.env?.variables },
      codebase: { git },
      infrastructure: { docker: state.docker },
      configuration: { application: state.php, extensions: state.php?.extensions ?? [] },
      dependencies: { runtime: { packages: state.composer?.packages ?? [] }, system: { packages: [] } },
      semantic: {},
      runtime: state.php ?? null,
      dependenciesArray: state.composer?.packages ?? [],
      config: state.env ?? null,
      docker: state.docker ?? null,
      metadata,
      fingerprint: {},
    }));
    const fingerprint = await this.stateGraphService.fingerprintManifest(manifest);
    manifest.fingerprint = { combined: fingerprint };
    await this.manifests.save(manifest);
    await this.stateGraphService.addManifestToGraph(manifest, previous?.id);
    return manifest;
  }

  async findProjectManifests(projectId: string) { return this.manifests.find({ where: { projectId }, order: { timestamp: 'ASC' } }); }
  async findOne(projectId: string, id: string) {
    const manifest = await this.manifests.findOne({ where: { id, projectId } });
    if (!manifest) throw new NotFoundException('State manifest not found');
    return manifest;
  }
}
