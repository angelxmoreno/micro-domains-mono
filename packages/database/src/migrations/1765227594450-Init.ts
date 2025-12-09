import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1765227594450 implements MigrationInterface {
    name = 'Init1765227594450';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`words\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`name\` varchar(255) NOT NULL,
                INDEX \`words_created_at\` (\`created_at\`),
                UNIQUE INDEX \`words_name\` (\`name\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`words_name\` ON \`words\`
        `);
        await queryRunner.query(`
            DROP INDEX \`words_created_at\` ON \`words\`
        `);
        await queryRunner.query(`
            DROP TABLE \`words\`
        `);
    }
}
