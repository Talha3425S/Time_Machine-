import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { AgentState } from './agent-state.entity';
import { Incident } from './incident.entity';

@Entity('test_runs')
export class TestRun {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() projectId: string;
  @Column() command: string;
  @Column() passed: boolean;
  @Column() exitCode: number;
  @Column({ type: 'text', nullable: true }) output: string;
  @Column({ default: 0 }) durationMs: number;
  @Column({ default: false }) timedOut: boolean;
  @Column({ type: 'varchar', nullable: true }) stateId: string | null;
  @Column({ type: 'varchar', nullable: true }) incidentId: string | null;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => Project) @JoinColumn({ name: 'projectId' }) project: Project;
  @ManyToOne(() => AgentState, { nullable: true }) @JoinColumn({ name: 'stateId' }) state: AgentState;
  @ManyToOne(() => Incident, { nullable: true }) @JoinColumn({ name: 'incidentId' }) incident: Incident;
}
