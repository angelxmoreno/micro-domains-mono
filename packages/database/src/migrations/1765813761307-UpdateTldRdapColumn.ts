import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTldRdapColumn1765813761307 implements MigrationInterface {
    name = 'UpdateTldRdapColumn1765813761307';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_server\` \`rdap_servers\` varchar(255) NULL DEFAULT 'NULL'
        `);
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
            ALTER TABLE \`top_level_domains\` DROP COLUMN \`rdap_servers\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\`
            ADD \`rdap_servers\` text NULL
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
            ALTER TABLE \`top_level_domains\` DROP COLUMN \`rdap_servers\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\`
            ADD \`rdap_servers\` varchar(255) NULL DEFAULT 'NULL'
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
        await queryRunner.query(`
            ALTER TABLE \`top_level_domains\` CHANGE \`rdap_servers\` \`rdap_server\` varchar(255) NULL DEFAULT 'NULL'
        `);
    }
}
