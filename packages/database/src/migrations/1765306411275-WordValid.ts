import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WordValid1765306411275 implements MigrationInterface {
    name = 'WordValid1765306411275';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`words\`
            ADD \`valid\` tinyint NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`part_of_speech\` \`part_of_speech\` varchar(50) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`origin\` \`origin\` varchar(100) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`location\` \`location\` varchar(100) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`definition\` \`definition\` text NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`definition\` \`definition\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`location\` \`location\` varchar(100) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`origin\` \`origin\` varchar(100) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`part_of_speech\` \`part_of_speech\` varchar(50) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` DROP COLUMN \`valid\`
        `);
    }
}
