import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "repositoryUrl" varchar NOT NULL,
        "defaultTestCommand" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_projects_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // Incidents table
    await queryRunner.query(`
      CREATE TABLE "incidents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "projectId" uuid NOT NULL,
        "title" varchar NOT NULL,
        "description" text,
        "status" varchar NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'investigating', 'resolved')),
        "failureType" varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_incidents_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    // State manifests table
    await queryRunner.query(`
      CREATE TABLE "state_manifests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "projectId" uuid NOT NULL,
        "incidentId" uuid,
        "gitCommit" varchar(40) NOT NULL,
        "gitBranch" varchar NOT NULL,
        "runtime" jsonb NOT NULL,
        "dependencies" jsonb NOT NULL DEFAULT '[]',
        "config" jsonb NOT NULL,
        "docker" jsonb,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_state_manifests_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_state_manifests_incident" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE SET NULL
      )
    `);

    // Hypotheses table
    await queryRunner.query(`
      CREATE TABLE "hypotheses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "incidentId" uuid NOT NULL,
        "description" text NOT NULL,
        "score" decimal(5,2) NOT NULL DEFAULT 0,
        "status" varchar NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'testing', 'confirmed', 'rejected')),
        "suspectedChanges" jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_hypotheses_incident" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE
      )
    `);

    // Experiments table
    await queryRunner.query(`
      CREATE TABLE "experiments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "hypothesisId" uuid NOT NULL,
        "intervention" jsonb NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'running', 'completed', 'failed')),
        "result" jsonb,
        "estimatedCost" decimal(10,2) NOT NULL DEFAULT 0,
        "actualCost" decimal(10,2),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "completedAt" timestamp,
        CONSTRAINT "fk_experiments_hypothesis" FOREIGN KEY ("hypothesisId") REFERENCES "hypotheses"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "idx_projects_organization" ON "projects"("organizationId")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_project" ON "incidents"("projectId")`);
    await queryRunner.query(`CREATE INDEX "idx_incidents_status" ON "incidents"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_state_manifests_project" ON "state_manifests"("projectId")`);
    await queryRunner.query(`CREATE INDEX "idx_state_manifests_incident" ON "state_manifests"("incidentId")`);
    await queryRunner.query(`CREATE INDEX "idx_state_manifests_timestamp" ON "state_manifests"("timestamp")`);
    await queryRunner.query(`CREATE INDEX "idx_hypotheses_incident" ON "hypotheses"("incidentId")`);
    await queryRunner.query(`CREATE INDEX "idx_hypotheses_status" ON "hypotheses"("status")`);
    await queryRunner.query(`CREATE INDEX "idx_experiments_hypothesis" ON "experiments"("hypothesisId")`);
    await queryRunner.query(`CREATE INDEX "idx_experiments_status" ON "experiments"("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "experiments"`);
    await queryRunner.query(`DROP TABLE "hypotheses"`);
    await queryRunner.query(`DROP TABLE "state_manifests"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
