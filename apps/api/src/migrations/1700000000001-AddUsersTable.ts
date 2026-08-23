import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersTable1700000000001 implements MigrationInterface {
  name = 'AddUsersTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "githubId" varchar NOT NULL UNIQUE,
        "username" varchar NOT NULL,
        "email" varchar NOT NULL,
        "avatarUrl" varchar,
        "accessToken" varchar,
        "role" varchar NOT NULL DEFAULT 'member' CHECK ("role" IN ('admin', 'member', 'viewer')),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_users_githubId" ON "users"("githubId")`);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
