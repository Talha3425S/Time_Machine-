import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Incident } from './incident.entity';

@Entity('hypotheses')
export class Hypothesis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  incidentId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'testing', 'confirmed', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'testing' | 'confirmed' | 'rejected';

  @Column({ type: 'jsonb', default: '[]' })
  suspectedChanges: string[];

  @Column({ default: 0 })
  rank: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedCost: number;

  @Column({ type: 'jsonb', nullable: true })
  evidence: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Incident)
  @JoinColumn({ name: 'incidentId' })
  incident: Incident;
}
