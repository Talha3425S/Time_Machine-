import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStateGraphFoundation1700000000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "environment" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "codebase" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "infrastructure" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "configuration" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "semantic" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "dependenciesArray" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "metadata" jsonb`);
    await queryRunner.query(`ALTER TABLE "state_manifests" ADD COLUMN IF NOT EXISTS "fingerprint" jsonb`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "state_graphs_relationshiptype_enum" AS ENUM ('direct','derived','causal','temporal'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "state_graphs_classification_enum" AS ENUM ('unknown','compatible','breaking','degraded'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "state_graph_nodes_statetype_enum" AS ENUM ('baseline','stable','unstable','failure'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "state_graph_edges_edgetype_enum" AS ENUM ('direct','derived','causal','temporal'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "state_graph_edges_risklevel_enum" AS ENUM ('unknown','safe','risky','dangerous'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "state_graphs" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "sourceManifestId" uuid NOT NULL REFERENCES "state_manifests"("id") ON DELETE CASCADE, "targetManifestId" uuid NOT NULL REFERENCES "state_manifests"("id") ON DELETE CASCADE, "relationshipType" "state_graphs_relationshiptype_enum" NOT NULL DEFAULT 'temporal', "distance" integer NOT NULL DEFAULT 1, "diffResult" jsonb, "semanticFingerprint" jsonb, "classification" "state_graphs_classification_enum" NOT NULL DEFAULT 'unknown', "criticalChanges" integer NOT NULL DEFAULT 0, "majorChanges" integer NOT NULL DEFAULT 0, "minorChanges" integer NOT NULL DEFAULT 0, "metadata" jsonb, "analysis" jsonb, "createdAt" timestamp NOT NULL DEFAULT now(), UNIQUE ("sourceManifestId", "targetManifestId"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "state_graph_nodes" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "manifestId" uuid NOT NULL REFERENCES "state_manifests"("id") ON DELETE CASCADE, "projectId" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE, "fingerprint" jsonb NOT NULL, "indegree" integer NOT NULL DEFAULT 0, "outdegree" integer NOT NULL DEFAULT 0, "nodeData" jsonb, "stateType" "state_graph_nodes_statetype_enum" NOT NULL DEFAULT 'baseline', "gitCommit" varchar, "gitBranch" varchar, "createdAt" timestamp NOT NULL DEFAULT now(), UNIQUE ("manifestId"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "state_graph_edges" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "sourceNodeId" uuid NOT NULL REFERENCES "state_graph_nodes"("id") ON DELETE CASCADE, "targetNodeId" uuid NOT NULL REFERENCES "state_graph_nodes"("id") ON DELETE CASCADE, "graphId" uuid NOT NULL REFERENCES "state_graphs"("id") ON DELETE CASCADE, "edgeType" "state_graph_edges_edgetype_enum" NOT NULL DEFAULT 'temporal', "weight" integer NOT NULL DEFAULT 1, "edgeData" jsonb, "riskLevel" "state_graph_edges_risklevel_enum" NOT NULL DEFAULT 'unknown', "changeAnalysis" jsonb, "createdAt" timestamp NOT NULL DEFAULT now(), UNIQUE ("sourceNodeId", "targetNodeId"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_state_graphs_project" ON "state_graphs"("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_state_graph_nodes_project" ON "state_graph_nodes"("projectId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_state_graph_edges_graph" ON "state_graph_edges"("graphId")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE IF EXISTS "state_graph_edges"`); await queryRunner.query(`DROP TABLE IF EXISTS "state_graph_nodes"`); await queryRunner.query(`DROP TABLE IF EXISTS "state_graphs"`); }
}
