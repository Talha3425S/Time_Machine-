import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Project } from './project.entity';
import { StateManifest } from './state-manifest.entity';

/**
 * StateGraph represents the relationship between state manifests
 * Used for tracking state evolution and causal relationships
 */
@Entity('state_graphs')
export class StateGraph {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  sourceManifestId: string;

  @Column()
  targetManifestId: string;

  // Graph relationship properties
  @Column({ type: 'enum', enum: ['direct', 'derived', 'causal', 'temporal'], default: 'temporal' })
  relationshipType: 'direct' | 'derived' | 'causal' | 'temporal';

  @Column({ default: 1 })
  distance: number; // Number of steps between states

  @Column({ type: 'jsonb', nullable: true })
  diffResult: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  semanticFingerprint: Record<string, any>;

  // Classification and analysis
  @Column({ type: 'enum', enum: ['unknown', 'compatible', 'breaking', 'degraded'], default: 'unknown' })
  classification: 'unknown' | 'compatible' | 'breaking' | 'degraded';

  @Column({ default: 0 })
  criticalChanges: number;

  @Column({ default: 0 })
  majorChanges: number;

  @Column({ default: 0 })
  minorChanges: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  analysis: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => StateManifest)
  @JoinColumn({ name: 'sourceManifestId' })
  sourceManifest: StateManifest;

  @ManyToOne(() => StateManifest)
  @JoinColumn({ name: 'targetManifestId' })
  targetManifest: StateManifest;

  // Indexes for graph traversal
  @Index(['projectId'])
  @Index(['sourceManifestId'])
  @Index(['targetManifestId'])
  @Index(['relationshipType'])
  @Index(['classification'])
  @Index(['createdAt'])
}

/**
 * StateGraphNode represents a node in the state graph
 * Used for graph algorithms and visualization
 */
@Entity('state_graph_nodes')
export class StateGraphNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  manifestId: string;

  @Column()
  projectId: string;

  // Node properties
  @Column({ type: 'jsonb' })
  fingerprint: Record<string, any>;

  @Column({ default: 0 })
  indegree: number; // Number of incoming edges

  @Column({ default: 0 })
  outdegree: number; // Number of outgoing edges

  @Column({ type: 'jsonb', nullable: true })
  nodeData: Record<string, any>;

  // Classification
  @Column({ type: 'enum', enum: ['baseline', 'stable', 'unstable', 'failure'], default: 'baseline' })
  stateType: 'baseline' | 'stable' | 'unstable' | 'failure';

  @Column({ nullable: true })
  gitCommit: string;

  @Column({ nullable: true })
  gitBranch: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => StateManifest)
  @JoinColumn({ name: 'manifestId' })
  manifest: StateManifest;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // Indexes
  @Index(['projectId'])
  @Index(['manifestId'])
  @Index(['stateType'])
  @Index(['gitCommit'])
}

/**
 * StateGraphEdge represents an edge in the state graph
 * Used for graph algorithms and visualization
 */
@Entity('state_graph_edges')
export class StateGraphEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceNodeId: string;

  @Column()
  targetNodeId: string;

  @Column()
  graphId: string;

  // Edge properties
  @Column({ type: 'enum', enum: ['direct', 'derived', 'causal', 'temporal'], default: 'temporal' })
  edgeType: 'direct' | 'derived' | 'causal' | 'temporal';

  @Column({ default: 1 })
  weight: number;

  @Column({ type: 'jsonb', nullable: true })
  edgeData: Record<string, any>;

  // Analysis
  @Column({ type: 'enum', enum: ['unknown', 'safe', 'risky', 'dangerous'], default: 'unknown' })
  riskLevel: 'unknown' | 'safe' | 'risky' | 'dangerous';

  @Column({ type: 'jsonb', nullable: true })
  changeAnalysis: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => StateGraphNode)
  @JoinColumn({ name: 'sourceNodeId' })
  sourceNode: StateGraphNode;

  @ManyToOne(() => StateGraphNode)
  @JoinColumn({ name: 'targetNodeId' })
  targetNode: StateGraphNode;

  @ManyToOne(() => StateGraph)
  @JoinColumn({ name: 'graphId' })
  graph: StateGraph;

  // Indexes
  @Index(['sourceNodeId'])
  @Index(['targetNodeId'])
  @Index(['graphId'])
  @Index(['edgeType'])
  @Index(['riskLevel'])
}
