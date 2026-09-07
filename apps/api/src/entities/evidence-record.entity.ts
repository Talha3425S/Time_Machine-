import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('evidence_records')
export class EvidenceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  incidentId: string;

  @Column({ type: 'varchar', nullable: true })
  experimentId: string | null;

  @Column()
  sourceType: 'test_run' | 'experiment' | 'hypothesis';

  @Column()
  sourceId: string;

  @Column()
  type: 'log' | 'metric' | 'state' | 'assertion';

  @Column({ type: 'text' })
  claim: string;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  confidence: number;

  @Column({ type: 'jsonb', default: '{}' })
  provenance: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
