import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TrimWordColumns1765390000000 implements MigrationInterface {
    name = 'TrimWordColumns1765390000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `words` DROP COLUMN `part_of_speech`');
        await queryRunner.query('ALTER TABLE `words` DROP COLUMN `origin`');
        await queryRunner.query('ALTER TABLE `words` DROP COLUMN `location`');
        await queryRunner.query('ALTER TABLE `words` DROP COLUMN `definition`');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `words` ADD `definition` text NULL');
        await queryRunner.query('ALTER TABLE `words` ADD `location` varchar(100) NULL');
        await queryRunner.query('ALTER TABLE `words` ADD `origin` varchar(100) NULL');
        await queryRunner.query('ALTER TABLE `words` ADD `part_of_speech` varchar(50) NULL');
    }
}
