import {
    type AppCommand,
    CliLogger,
    CliOutputService,
    createTypedCommand,
    type TypedActionFunction,
} from '@repo/cli-helper';
import wordnetDb from 'wordnet-db';
import { db } from '../db';
import { type DbDataBuilderDependencies, DbDataBuilderService } from '../services/DbDataBuilderService';

type DbImportOptions = {
    limit?: string;
};

export const DbImportAction: TypedActionFunction<[], DbImportOptions> = async ({ container, limit }) => {
    const logger = container.resolve(CliLogger);
    const output = container.resolve(CliOutputService);

    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
        output.log('The --limit option must be a positive number.');
        return;
    }

    const builderDependencies: DbDataBuilderDependencies = {
        logger,
        wordnetDataDir: wordnetDb.path,
        db,
    };
    const service = new DbDataBuilderService(builderDependencies);
    const startTime = Date.now();
    const limitLabel = parsedLimit !== undefined ? `${parsedLimit} synsets` : 'all synsets';
    output.log(`Starting WordNet database import (${limitLabel})...`);
    const processedCount = await service.importEntireDictionary(parsedLimit);
    const elapsedMs = Date.now() - startTime;
    logger.info({ elapsedMs, processedCount }, 'WordNet import completed');
    output.log(`Imported ${processedCount} synsets in ${Math.round(elapsedMs / 1000)}s`);
};

export const DbImportCommand: AppCommand = createTypedCommand(
    {
        command: 'db-import',
        description: 'Imports WordNet data into the SQLite database.',
        options: [
            {
                flags: '-l, --limit <number>',
                description: 'Import only the first N synsets (useful for smoke tests).',
            },
        ],
    },
    DbImportAction
);
