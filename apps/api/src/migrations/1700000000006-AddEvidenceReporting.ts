import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvidenceReporting1700000000006 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "evidence_records" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "incidentId" uuid NOT NULL REFERENCES "incidents"("id") ON DELETE CASCADE, "experimentId" uuid, "sourceType" varchar NOT NULL, "sourceId" varchar NOT NULL, "type" varchar NOT NULL, "claim" text NOT NULL, "confidence" numeric(5,4) NOT NULL DEFAULT 0, "provenance" jsonb NOT NULL DEFAULT '{}', "createdAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_evidence_source_type" ON "evidence_records"("incidentId", "sourceType", "sourceId", "type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_evidence_incident_created" ON "evidence_records"("incidentId", "createdAt")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "proof_reports" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "incidentId" uuid NOT NULL REFERENCES "incidents"("id") ON DELETE CASCADE, "rootCause" text NOT NULL, "confidence" numeric(5,4) NOT NULL DEFAULT 0, "supportingExperimentIds" jsonb NOT NULL DEFAULT '[]', "supportingEvidenceIds" jsonb NOT NULL DEFAULT '[]', "citations" jsonb NOT NULL DEFAULT '[]', "verifiedRepair" text, "limitations" jsonb NOT NULL DEFAULT '[]', "trialSummary" jsonb NOT NULL DEFAULT '{}', "createdAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_proof_reports_incident_created" ON "proof_reports"("incidentId", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "proof_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "evidence_records"`);
  }
}
