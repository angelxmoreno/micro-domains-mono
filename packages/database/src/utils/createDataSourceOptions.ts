import type { DatabaseConfig } from '@repo/shared-types/src/schemas/DatabaseConfigSchema';
import { type Logger, pino } from 'pino';
import pretty from 'pino-pretty';
import type { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmPinoLogger } from 'typeorm-pino-logger';
import { InflectionNamingStrategy } from '../naming-strategy/InflectionNamingStrategy';
import { parseDsnString } from './parseDsnString';

const createLogger = (parentLogger?: Logger): Logger => (parentLogger ?? pino(pretty())).child({ module: 'database' });
export function createDataSourceOptions(config: DatabaseConfig, parentLogger?: Logger): DataSourceOptions {
    const logger = createLogger(parentLogger);
    const typeormLogger = new TypeOrmPinoLogger(logger ?? pino(), {
        logQueries: false,
        logSchemaOperations: false,
        messageFilter: (_message, type) => type === 'general',
    });
    const parsedUrlConfigs = parseDsnString(config.url);
    const RootPath = `${__dirname}/..`;
    return {
        ...parsedUrlConfigs,
        entities: [`${RootPath}/entities/*Entity.{ts,js}`],
        migrations: [`${RootPath}/migrations/*.{ts,js}`],
        migrationsTableName: 'typeorm_migrations',
        namingStrategy: new InflectionNamingStrategy(),
        logger: typeormLogger,
    } as DataSourceOptions;
}

/**
 * Initialize and return a database connection
 * Apps should use this with their own configuration
 */
export async function initializeDatabase(ds: DataSource, parentLogger?: Logger): Promise<DataSource> {
    const logger = createLogger(parentLogger);
    let message = 'Database connection already initialized';
    try {
        if (!ds.isInitialized) {
            message = 'Database connection initialized';
        }

        logger.info(
            {
                options: ds.options,
            },
            message
        );
        return ds;
    } catch (error) {
        logger.error({ error }, 'Error during database initialization');
        throw error;
    }
}

/**
 * Gracefully close database connection
 */
export async function closeDatabase(ds: DataSource, parentLogger?: Logger): Promise<void> {
    const logger = createLogger(parentLogger);
    let message = 'Database connection already closed';

    try {
        if (ds.isInitialized) {
            await ds.destroy();
            message = 'Database connection closed';
        }
        logger.info(message);
    } catch (error) {
        const message = 'Error closing database connection';
        logger.error({ error }, message);
        throw error;
    }
}
