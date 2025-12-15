import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTldActiveColumn1765817719745 implements MigrationInterface {
    name = 'UpdateTldActiveColumn1765817719745';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`type\` \`type\` enum (
                    'generic',
                    'country-code',
                    'sponsored',
                    'infrastructure'
                ) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`whois_server\` \`whois_server\` varchar(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_servers\` \`rdap_servers\` text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`is_active\` \`is_active\` tinyint NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`valid\` \`valid\` tinyint NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`valid\` \`valid\` tinyint NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`words\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`is_active\` \`is_active\` tinyint NOT NULL DEFAULT '1'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_servers\` \`rdap_servers\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`whois_server\` \`whois_server\` varchar(255) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`type\` \`type\` enum (
                    'generic',
                    'country-code',
                    'sponsored',
                    'infrastructure'
                ) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
    }
}
