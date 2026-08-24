import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Project } from './project.entity';

@Entity('agent_states')
export class AgentState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'jsonb' })
  gitState: any;

  @Column({ type: 'jsonb', nullable: true })
  phpState: any;

  @Column({ type: 'jsonb', nullable: true })
  composerState: any;

  @Column({ type: 'jsonb', nullable: true })
  dockerState: any;

  @Column({ type: 'jsonb', nullable: true })
  environmentState: any;

  @Column({ type: 'jsonb', nullable: true })
  fullState: any;

  @Column({ nullable: true })
  agentVersion: string;

  @Column({ nullable: true })
  hostname: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: 'manual' })
  collectionTrigger: 'manual' | 'scheduled' | 'webhook' | 'ci';

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  processingResults: any;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastProcessedAt: Date;

  @Index('projectId')
  @Index('createdAt')
  @Index('processed')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
