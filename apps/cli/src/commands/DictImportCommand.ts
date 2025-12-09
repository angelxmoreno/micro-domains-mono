import { select } from '@inquirer/prompts';
import { AppLogger } from '@repo/config-builder';
import { DataSource, initializeDatabase } from '@repo/database';
import ora from 'ora';

import { CliOutputService } from '../services/CliOutputService';
import type { BaseGitHubImport } from '../services/DictImport/GitHubImport/BaseGitHubImport';
import { DwylEnglishWordsImport } from '../services/DictImport/GitHubImport/DwylEnglishWordsImport';
import { createTypedCommand, type TypedActionFunction } from '../types';

export const dictImportAction: TypedActionFunction<[source?: string]> = async (
    sourceArg,
    { container }
): Promise<void> => {
    const cliOutput = container.resolve(CliOutputService);
    const logger = container.resolve(AppLogger);
    const database = container.resolve(DataSource);
    await initializeDatabase(database, logger);
    const dwylEnglishWordsImport = container.resolve(DwylEnglishWordsImport);

    const sources: Record<string, BaseGitHubImport> = {
        [DwylEnglishWordsImport.name]: dwylEnglishWordsImport,
    };
    const availableSources = Object.keys(sources);

    let sourceToImport = sourceArg;

    if (!sourceToImport) {
        // Prompt user to choose a source if not provided as an argument
        sourceToImport = await select({
            message: 'Choose an import source:',
            choices: availableSources,
        });
    }

    if (!sourceToImport || !availableSources.includes(sourceToImport)) {
        cliOutput.error(`Error: Unknown import source "${sourceToImport}"`);
        process.exit(1);
    }

    logger.debug({ source: sourceToImport }, `Starting import for source: ${sourceToImport}`);

    const importer = sources[sourceToImport];

    if (!importer) {
        cliOutput.error(`Error: Unhandled import source "${sourceToImport}"`);
        process.exit(1);
    }

    cliOutput.log(`Importing using ${importer.repoUrl}...`);
    const spinner = ora().start();
    try {
        await importer.run();
        spinner.succeed();
    } catch (e) {
        const error = e as Error;
        spinner.fail(error.message);
    }
};

export const dictImportProgram = createTypedCommand(
    {
        command: 'dict:import', // Defines the command and its optional argument
        description: 'Imports a dictionary from a specified source, or prompts to choose one.',
        arguments: [
            {
                name: '[source]',
                description: 'The name of the dictionary source to import from (e.g., waylo, bubalo).',
            },
        ],
    },
    dictImportAction
);
