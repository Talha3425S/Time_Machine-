import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StateGraph } from '../entities/state-graph.entity';
import { StateGraphNode } from '../entities/state-graph.entity';
import { StateGraphEdge } from '../entities/state-graph.entity';
import { StateManifest } from '../entities/state-manifest.entity';
import { SemanticDiffService, DiffResult } from './semantic-diff.service';

@Injectable()
export class StateGraphService {
  constructor(
    @InjectRepository(StateGraph)
    private stateGraphRepository: Repository<StateGraph>,
    @InjectRepository(StateGraphNode)
    private stateGraphNodeRepository: Repository<StateGraphNode>,
    @InjectRepository(StateGraphEdge)
    private stateGraphEdgeRepository: Repository<StateGraphEdge>,
    @InjectRepository(StateManifest)
    private stateManifestRepository: Repository<StateManifest>,
    private semanticDiffService: SemanticDiffService,
  ) {}

  /**
   * Create state graph relationship between two manifests
   */
  async createGraphEdge(
    sourceManifestId: string,
    targetManifestId: string,
    relationshipType: 'direct' | 'derived' | 'causal' | 'temporal' = 'temporal',
  ): Promise<StateGraph> {
    const sourceManifest = await this.stateManifestRepository.findOne({
      where: { id: sourceManifestId },
    });
    const targetManifest = await this.stateManifestRepository.findOne({
      where: { id: targetManifestId },
    });

    if (!sourceManifest || !targetManifest) {
      throw new Error('One or both manifests not found');
    }

    // Compute semantic diff
    const diffResult = await this.semanticDiffService.computeDiff(
      sourceManifestId,
      targetManifestId,
    );

    // Generate semantic fingerprints
    const sourceFingerprint = this.semanticDiffService.generateFingerprint(sourceManifest);
    const targetFingerprint = this.semanticDiffService.generateFingerprint(targetManifest);

    // Create graph edge
    const graph = this.stateGraphRepository.create({
      projectId: sourceManifest.projectId,
      sourceManifestId,
      targetManifestId,
      relationshipType,
      distance: 1,
      diffResult,
      semanticFingerprint: {
        source: sourceFingerprint,
        target: targetFingerprint,
      },
      classification: this.classifyChange(diffResult),
      criticalChanges: diffResult.summary.criticalChanges,
      majorChanges: diffResult.changes.filter(c => c.severity === 'major').length,
      minorChanges: diffResult.changes.filter(c => c.severity === 'minor').length,
      metadata: {
        createdAt: new Date(),
        sourceTimestamp: sourceManifest.timestamp,
        targetTimestamp: targetManifest.timestamp,
      },
    });

    return this.stateGraphRepository.save(graph);
  }

  /**
   * Build state graph for a project
   */
  async buildProjectGraph(projectId: string): Promise<StateGraph[]> {
    const manifests = await this.stateManifestRepository.find({
      where: { projectId },
      order: { timestamp: 'ASC' },
    });

    if (manifests.length < 2) {
      return [];
    }

    const graphEdges: StateGraph[] = [];

    // Create edges between consecutive manifests
    for (let i = 0; i < manifests.length - 1; i++) {
      const edge = await this.createGraphEdge(
        manifests[i].id,
        manifests[i + 1].id,
        'temporal',
      );
      graphEdges.push(edge);
    }

    // Create graph nodes
    await this.createGraphNodes(manifests);

    // Create graph edges for visualization
    await this.createGraphEdges(graphEdges);

    return graphEdges;
  }

  /**
   * Create graph nodes from manifests
   */
  private async createGraphNodes(manifests: StateManifest[]): Promise<void> {
    for (const manifest of manifests) {
      const fingerprint = this.semanticDiffService.generateFingerprint(manifest);

      const existingNode = await this.stateGraphNodeRepository.findOne({
        where: { manifestId: manifest.id },
      });

      if (!existingNode) {
        const node = this.stateGraphNodeRepository.create({
          manifestId: manifest.id,
          projectId: manifest.projectId,
          fingerprint: { environment: fingerprint },
          indegree: 0,
          outdegree: 0,
          nodeData: {
            timestamp: manifest.timestamp,
            gitCommit: manifest.gitCommit,
            gitBranch: manifest.gitBranch,
          },
          stateType: this.classifyNodeState(manifest),
          gitCommit: manifest.gitCommit,
          gitBranch: manifest.gitBranch,
        });

        await this.stateGraphNodeRepository.save(node);
      }
    }
  }

  /**
   * Create graph edges for visualization
   */
  private async createGraphEdges(graphEdges: StateGraph[]): Promise<void> {
    for (const graph of graphEdges) {
      const sourceNode = await this.stateGraphNodeRepository.findOne({
        where: { manifestId: graph.sourceManifestId },
      });
      const targetNode = await this.stateGraphNodeRepository.findOne({
        where: { manifestId: graph.targetManifestId },
      });

      if (sourceNode && targetNode) {
        const existingEdge = await this.stateGraphEdgeRepository.findOne({
          where: {
            sourceNodeId: sourceNode.id,
            targetNodeId: targetNode.id,
          },
        });

        if (!existingEdge) {
          const edge = this.stateGraphEdgeRepository.create({
            sourceNodeId: sourceNode.id,
            targetNodeId: targetNode.id,
            graphId: graph.id,
            edgeType: graph.relationshipType,
            weight: 1,
            edgeData: {
              criticalChanges: graph.criticalChanges,
              majorChanges: graph.majorChanges,
              minorChanges: graph.minorChanges,
            },
            riskLevel: this.determineRiskLevel(graph),
            changeAnalysis: {
              classification: graph.classification,
              summary: graph.diffResult?.summary,
            },
          });

          await this.stateGraphEdgeRepository.save(edge);

          // Update node degrees
          sourceNode.outdegree++;
          targetNode.indegree++;
          await this.stateGraphNodeRepository.save(sourceNode);
          await this.stateGraphNodeRepository.save(targetNode);
        }
      }
    }
  }

  /**
   * Classify change impact
   */
  private classifyChange(diffResult: DiffResult): StateGraph['classification'] {
    if (diffResult.summary.breakingChanges > 0) {
      return 'breaking';
    }
    if (diffResult.summary.criticalChanges > 0) {
      return 'degraded';
    }
    if (diffResult.summary.totalChanges > 0) {
      return 'compatible';
    }
    return 'unknown';
  }

  /**
   * Classify node state
   */
  private classifyNodeState(manifest: StateManifest): StateGraphNode['stateType'] {
    // Check for failure indicators
    if (manifest.metadata?.status === 'failure') {
      return 'failure';
    }

    // Check for stability indicators
    const hasErrors = manifest.metadata?.errors?.length > 0;
    if (hasErrors) {
      return 'unstable';
    }

    // Check if this is a known good state
    if (manifest.metadata?.isBaseline) {
      return 'baseline';
    }

    return 'stable';
  }

  /**
   * Determine risk level of a graph edge
   */
  private determineRiskLevel(graph: StateGraph): StateGraphEdge['riskLevel'] {
    if (graph.criticalChanges > 0) {
      return 'dangerous';
    }
    if (graph.majorChanges > 3) {
      return 'risky';
    }
    if (graph.classification === 'breaking') {
      return 'dangerous';
    }
    if (graph.classification === 'degraded') {
      return 'risky';
    }
    return 'safe';
  }

  /**
   * Get state graph for a project
   */
  async getProjectGraph(projectId: string): Promise<{
    nodes: StateGraphNode[];
    edges: StateGraphEdge[];
  }> {
    const nodes = await this.stateGraphNodeRepository.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });

    const nodeIds = nodes.map(n => n.id);
    const edges = await this.stateGraphEdgeRepository.find({
      where: [
        { sourceNodeId: nodeIds },
        { targetNodeId: nodeIds },
      ],
    });

    return { nodes, edges };
  }

  /**
   * Find shortest path between two states
   */
  async findShortestPath(
    sourceManifestId: string,
    targetManifestId: string,
  ): Promise<StateGraph[]> {
    // Simple BFS implementation for finding shortest path
    const visited = new Set<string>();
    const queue: string[] = [sourceManifestId];
    const path: Map<string, string[]> = new Map();
    path.set(sourceManifestId, [sourceManifestId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === targetManifestId) {
        const manifestPath = path.get(targetManifestId) || [];
        const graphEdges: StateGraph[] = [];

        for (let i = 0; i < manifestPath.length - 1; i++) {
          const edge = await this.stateGraphRepository.findOne({
            where: {
              sourceManifestId: manifestPath[i],
              targetManifestId: manifestPath[i + 1],
            },
          });
          if (edge) {
            graphEdges.push(edge);
          }
        }

        return graphEdges;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      // Get outgoing edges
      const outgoingEdges = await this.stateGraphRepository.find({
        where: { sourceManifestId: current },
      });

      for (const edge of outgoingEdges) {
        if (!visited.has(edge.targetManifestId)) {
          queue.push(edge.targetManifestId);
          path.set(edge.targetManifestId, [...(path.get(current) || []), edge.targetManifestId]);
        }
      }
    }

    return []; // No path found
  }

  /**
   * Get state ancestors (previous states)
   */
  async getStateAncestors(manifestId: string, depth: number = 5): Promise<StateManifest[]> {
    const ancestors: StateManifest[] = [];
    const visited = new Set<string>();
    const queue: string[] = [manifestId];

    while (queue.length > 0 && ancestors.length < depth) {
      const current = queue.shift()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const incomingEdges = await this.stateGraphRepository.find({
        where: { targetManifestId: current },
      });

      for (const edge of incomingEdges) {
        const sourceManifest = await this.stateManifestRepository.findOne({
          where: { id: edge.sourceManifestId },
        });

        if (sourceManifest && !visited.has(sourceManifest.id)) {
          ancestors.push(sourceManifest);
          queue.push(sourceManifest.id);
        }
      }
    }

    return ancestors;
  }

  /**
   * Get state descendants (future states)
   */
  async getStateDescendants(manifestId: string, depth: number = 5): Promise<StateManifest[]> {
    const descendants: StateManifest[] = [];
    const visited = new Set<string>();
    const queue: string[] = [manifestId];

    while (queue.length > 0 && descendants.length < depth) {
      const current = queue.shift()!;

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const outgoingEdges = await this.stateGraphRepository.find({
        where: { sourceManifestId: current },
      });

      for (const edge of outgoingEdges) {
        const targetManifest = await this.stateManifestRepository.findOne({
          where: { id: edge.targetManifestId },
        });

        if (targetManifest && !visited.has(targetManifest.id)) {
          descendants.push(targetManifest);
          queue.push(targetManifest.id);
        }
      }
    }

    return descendants;
  }
}
