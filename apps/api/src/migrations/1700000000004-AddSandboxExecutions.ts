import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSandboxExecutions1700000000004 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "sandbox_executions_status_enum" AS ENUM ('creating','ready','running','restoring','completed','failed','cleaned'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sandbox_executions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "sandboxName" varchar NOT NULL UNIQUE, "workspacePath" varchar NOT NULL, "command" varchar NOT NULL, "candidateBranch" varchar, "baselineRef" varchar, "status" "sandbox_executions_status_enum" NOT NULL DEFAULT 'creating', "passed" boolean NOT NULL DEFAULT false, "allowNetwork" boolean NOT NULL DEFAULT false, "isolation" jsonb NOT NULL, "output" text, "error" text, "startedAt" timestamp, "completedAt" timestamp, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now())`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sandbox_executions_project" ON "sandbox_executions"("projectId")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE IF EXISTS "sandbox_executions"`); }
}
