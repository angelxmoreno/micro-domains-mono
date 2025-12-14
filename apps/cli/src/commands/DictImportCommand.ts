import { select } from '@inquirer/prompts';
import { CliLogger, CliOutputService, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';
import { DataSource, initializeDatabase } from '@repo/database';
import ora from 'ora';
import { DwylEnglishWordsImport } from '../services/DictImport/GitHubImport/DwylEnglishWordsImport';
import type { ImporterInterface } from '../services/DictImport/ImporterInterface';
import { WordNetImport } from '../services/DictImport/WordNetImport';

export const dictImportAction: TypedActionFunction<[source?: string]> = async (
    sourceArg,
    { container }
): Promise<void> => {
    const cliOutput = container.resolve(CliOutputService);
    const logger = container.resolve(CliLogger);
    const database = container.resolve(DataSource);
    await initializeDatabase(database, logger);
    const dwylEnglishWordsImport = container.resolve(DwylEnglishWordsImport);
    const wordNetImport = container.resolve(WordNetImport);

    const sources: Record<string, ImporterInterface> = {
        [dwylEnglishWordsImport.name]: dwylEnglishWordsImport,
        [wordNetImport.name]: wordNetImport,
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

    cliOutput.log(`Importing using ${importer.name}...`);
    const spinner = ora().start();

    try {
        await importer.run();
        spinner.succeed();
    } catch (e) {
        const error = e as Error;
        spinner.fail(error.message);
        process.exit(1);
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
