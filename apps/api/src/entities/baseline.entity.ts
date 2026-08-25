import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';
import { AgentState } from './agent-state.entity';

@Entity('baselines')
export class Baseline {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() projectId: string;
  @Column() command: string;
  @Column({ nullable: true }) stateId: string | null;
  @Column({ type: 'jsonb' }) result: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) fingerprint: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => Project) @JoinColumn({ name: 'projectId' }) project: Project;
  @ManyToOne(() => AgentState, { nullable: true }) @JoinColumn({ name: 'stateId' }) state: AgentState;
}
