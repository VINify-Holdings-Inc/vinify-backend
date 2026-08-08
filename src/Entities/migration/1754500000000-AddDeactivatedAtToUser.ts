import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeactivatedAtToUser1754500000000 implements MigrationInterface {
    name = "AddDeactivatedAtToUser1754500000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN "deactivatedAt" timestamptz NULL DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "deactivatedAt"`);
    }
}
