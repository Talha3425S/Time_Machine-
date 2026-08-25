import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFailureCapture1700000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "failureSignature" varchar`);
    await queryRunner.query(`ALTER TABLE "incidents" ADD COLUMN IF NOT EXISTS "metadata" jsonb`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "baselines" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "command" varchar NOT NULL, "stateId" uuid, "result" jsonb NOT NULL, "fingerprint" jsonb, "createdAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "test_runs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "command" varchar NOT NULL, "passed" boolean NOT NULL, "exitCode" integer NOT NULL, "output" text, "durationMs" integer NOT NULL DEFAULT 0, "timedOut" boolean NOT NULL DEFAULT false, "stateId" uuid, "incidentId" uuid REFERENCES "incidents"("id") ON DELETE SET NULL, "createdAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_baselines_project" ON "baselines"("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_test_runs_project" ON "test_runs"("projectId")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE IF EXISTS "test_runs"`); await queryRunner.query(`DROP TABLE IF EXISTS "baselines"`); await queryRunner.query(`ALTER TABLE "incidents" DROP COLUMN IF EXISTS "metadata"`); await queryRunner.query(`ALTER TABLE "incidents" DROP COLUMN IF EXISTS "failureSignature"`); }
}
