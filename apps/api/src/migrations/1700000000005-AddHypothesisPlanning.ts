import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHypothesisPlanning1700000000005 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hypotheses" ADD COLUMN IF NOT EXISTS "rank" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "hypotheses" ADD COLUMN IF NOT EXISTS "estimatedCost" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "hypotheses" ADD COLUMN IF NOT EXISTS "evidence" jsonb`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hypotheses_incident_rank" ON "hypotheses"("incidentId", "rank")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP INDEX IF EXISTS "idx_hypotheses_incident_rank"`); await queryRunner.query(`ALTER TABLE "hypotheses" DROP COLUMN IF EXISTS "evidence"`); await queryRunner.query(`ALTER TABLE "hypotheses" DROP COLUMN IF EXISTS "estimatedCost"`); await queryRunner.query(`ALTER TABLE "hypotheses" DROP COLUMN IF EXISTS "rank"`); }
}
