import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { Incident } from './incident.entity';

@Entity('state_manifests')
export class StateManifest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column({ nullable: true })
  incidentId: string;

  @Column({ length: 40 })
  gitCommit: string;

  @Column()
  gitBranch: string;

  // New structured fields matching manifest specification
  @Column({ type: 'jsonb', nullable: true })
  environment: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  codebase: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  infrastructure: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  dependencies: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  semantic: Record<string, any>;

  // Legacy fields for backward compatibility
  @Column({ type: 'jsonb', nullable: true })
  runtime: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  dependenciesArray: Record<string, any>[];

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  docker: Record<string, any>;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  fingerprint: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => Incident, { nullable: true })
  @JoinColumn({ name: 'incidentId' })
  incident: Incident;
}
