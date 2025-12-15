import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Tlds1765737398299 implements MigrationInterface {
    name = 'Tlds1765737398299';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`top_level_domains\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`tld\` varchar(63) NOT NULL,
                \`type\` enum (
                    'generic',
                    'country-code',
                    'sponsored',
                    'infrastructure'
                ) NULL,
                \`whois_server\` varchar(255) NULL,
                \`rdap_server\` varchar(255) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                INDEX \`top_level_domains_created_at\` (\`created_at\`),
                UNIQUE INDEX \`top_level_domains_tld\` (\`tld\`),
                INDEX \`top_level_domains_is_active\` (\`is_active\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
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
            DROP INDEX \`top_level_domains_is_active\` ON \`top_level_domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`top_level_domains_tld\` ON \`top_level_domains\`
        `);
        await queryRunner.query(`
            DROP INDEX \`top_level_domains_created_at\` ON \`top_level_domains\`
        `);
        await queryRunner.query(`
            DROP TABLE \`top_level_domains\`
        `);
    }
}
