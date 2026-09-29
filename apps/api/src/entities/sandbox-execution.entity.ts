import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sandbox_executions')
export class SandboxExecution {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() projectId: string;
  @Column() sandboxName: string;
  @Column() workspacePath: string;
  @Column() command: string;
  @Column({ type: 'varchar', nullable: true }) plannedExperimentId: string | null;
  @Column({ type: 'varchar', nullable: true }) candidateBranch: string | null;
  @Column({ type: 'varchar', nullable: true }) baselineRef: string | null;
  @Column({ type: 'enum', enum: ['creating', 'ready', 'running', 'restoring', 'completed', 'failed', 'cleaned'], default: 'creating' })
  status: 'creating' | 'ready' | 'running' | 'restoring' | 'completed' | 'failed' | 'cleaned';
  @Column({ default: false }) passed: boolean;
  @Column({ default: false }) allowNetwork: boolean;
  @Column({ type: 'jsonb' }) isolation: Record<string, unknown>;
  @Column({ type: 'text', nullable: true }) output: string | null;
  @Column({ type: 'text', nullable: true }) error: string | null;
  @Column({ type: 'timestamp', nullable: true }) startedAt: Date | null;
  @Column({ type: 'timestamp', nullable: true }) completedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
