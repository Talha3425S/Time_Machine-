import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkSandboxExecutionsToPlans1700000000007 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sandbox_executions" ADD COLUMN IF NOT EXISTS "plannedExperimentId" uuid REFERENCES "experiments"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sandbox_executions_planned_experiment" ON "sandbox_executions"("plannedExperimentId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sandbox_executions_planned_experiment"`);
    await queryRunner.query(`ALTER TABLE "sandbox_executions" DROP COLUMN IF EXISTS "plannedExperimentId"`);
  }
}
