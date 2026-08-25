import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentState } from '../entities/agent-state.entity';
import { Project } from '../entities/project.entity';
import { StateManifestService } from '../semantic/state-manifest.service';

@Injectable()
export class AgentStateService {
  constructor(
    @InjectRepository(AgentState)
    private agentStateRepository: Repository<AgentState>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly stateManifestService: StateManifestService,
  ) {}

  async uploadState(projectId: string, stateData: any, metadata: any = {}) {
    // Verify project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create agent state record
    const agentState = this.agentStateRepository.create({
      projectId,
      gitState: stateData.git || null,
      phpState: stateData.php || null,
      composerState: stateData.composer || null,
      dockerState: stateData.docker || null,
      environmentState: stateData.env || null,
      fullState: stateData,
      agentVersion: metadata.agentVersion || null,
      hostname: metadata.hostname || null,
      ipAddress: metadata.ipAddress || null,
      collectionTrigger: metadata.collectionTrigger || 'manual',
      metadata: metadata,
      processed: false,
    });

    await this.agentStateRepository.save(agentState);

    // Trigger processing (async)
    this.processAgentState(agentState.id).catch(err => {
      console.error('Failed to process agent state:', err);
    });

    return {
      success: true,
      stateId: agentState.id,
      message: 'State uploaded successfully',
    };
  }

  async getAgentState(stateId: string) {
    const state = await this.agentStateRepository.findOne({
      where: { id: stateId },
      relations: ['project'],
    });

    if (!state) {
      throw new NotFoundException('Agent state not found');
    }

    return state;
  }

  async getProjectStates(projectId: string, limit: number = 50, offset: number = 0) {
    const [states, total] = await this.agentStateRepository.findAndCount({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['project'],
    });

    return {
      states,
      total,
      limit,
      offset,
    };
  }

  async getLatestState(projectId: string) {
    const state = await this.agentStateRepository.findOne({
      where: { projectId },
      order: { createdAt: 'DESC' },
      relations: ['project'],
    });

    if (!state) {
      throw new NotFoundException('No agent states found for this project');
    }

    return state;
  }

  async processAgentState(stateId: string) {
    const state = await this.agentStateRepository.findOne({ where: { id: stateId } });
    if (!state) {
      throw new NotFoundException('Agent state not found');
    }

    try {
      const manifest = await this.stateManifestService.createFromAgentState(
        state.projectId,
        state.fullState || {},
        { ...(state.metadata || {}), agentStateId: state.id },
      );

      const processingResults = {
        manifestGenerated: true,
        manifestId: manifest.id,
        anomaliesDetected: [],
        changesDetected: [],
        processingTime: new Date().toISOString(),
      };

      state.processed = true;
      state.processingResults = processingResults;
      state.lastProcessedAt = new Date();
      state.retryCount = 0;

      await this.agentStateRepository.save(state);
    } catch (error) {
      state.processed = false;
      state.errorMessage = error.message;
      state.retryCount += 1;
      await this.agentStateRepository.save(state);
      throw error;
    }
  }

  async deleteState(stateId: string) {
    const state = await this.agentStateRepository.findOne({ where: { id: stateId } });
    if (!state) {
      throw new NotFoundException('Agent state not found');
    }

    await this.agentStateRepository.remove(state);
    return { success: true };
  }

  async getAgentConfiguration(projectId: string) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Return default or project-specific agent configuration
    return {
      projectId,
      collectors: {
        git: true,
        php: true,
        composer: true,
        docker: true,
        environment: true,
      },
      uploadFrequency: '5m',
      filters: {
        excludePaths: ['vendor/', 'node_modules/', '.git/'],
        excludeEnvVars: ['password', 'secret', 'token', 'api_key'],
      },
      metadata: project.metadata || {},
    };
  }

  async recordHeartbeat(projectId: string, heartbeatData: any) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Update project with heartbeat information
    const currentMetadata = project.metadata || {};
    project.metadata = {
      ...currentMetadata,
      lastHeartbeat: new Date().toISOString(),
      agentVersion: heartbeatData.agentVersion,
      hostname: heartbeatData.hostname,
    };

    await this.projectRepository.save(project);

    return {
      success: true,
      message: 'Heartbeat recorded',
    };
  }

  async reportError(projectId: string, errorData: any) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create an incident or log the error
    // For now, we'll just update project metadata
    const currentMetadata = project.metadata || {};
    project.metadata = {
      ...currentMetadata,
      lastError: {
        message: errorData.error,
        severity: errorData.severity,
        timestamp: new Date().toISOString(),
      },
    };

    await this.projectRepository.save(project);

    return {
      success: true,
      message: 'Error reported',
    };
  }
}
