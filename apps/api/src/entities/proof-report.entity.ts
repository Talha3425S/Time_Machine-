import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('proof_reports')
export class ProofReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  incidentId: string;

  @Column({ type: 'text' })
  rootCause: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  confidence: number;

  @Column({ type: 'jsonb', default: '[]' })
  supportingExperimentIds: string[];

  @Column({ type: 'jsonb', default: '[]' })
  supportingEvidenceIds: string[];

  @Column({ type: 'jsonb', default: '[]' })
  citations: Array<{ evidenceId: string; sourceType: string; sourceId: string; claim: string }>;

  @Column({ type: 'text', nullable: true })
  verifiedRepair: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  limitations: string[];

  @Column({ type: 'jsonb', default: '{}' })
  trialSummary: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
