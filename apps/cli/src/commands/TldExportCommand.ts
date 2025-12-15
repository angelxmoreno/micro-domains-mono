import { resolve } from 'node:path';
import { confirm } from '@inquirer/prompts';
import { CliLogger, CliOutputService, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';
import { DataSource, initializeDatabase, type TopLevelDomainEntity, TopLevelDomainRepository } from '@repo/database';
import ora from 'ora';

interface TldExportOptions extends Record<string, unknown> {
    file?: string;
    force?: boolean;
}

export const TldExportAction: TypedActionFunction<[], TldExportOptions> = async ({
    container,
    file,
    force = false,
}) => {
    const logger = container.resolve(CliLogger);
    const database = container.resolve(DataSource);
    const cliOutput = container.resolve(CliOutputService);
    const tldRepo = container.resolve(TopLevelDomainRepository);

    const targetPath = file || resolve('.', 'tld.json');
    const bunFile = Bun.file(targetPath, { type: 'application/json' });
    const fileExists = await bunFile.exists();

    if (fileExists && !force) {
        const answer = await confirm({ message: 'file exists do you want to overwrite?' });
        if (!answer) {
            cliOutput.errorAndExit('File already exists');
        }
    }
    let entities: TopLevelDomainEntity[] = [];
    const spinner = ora();
    try {
        spinner.start('fetching TLD records from db...');
        await initializeDatabase(database, logger);
        entities = await tldRepo.findMany({});
        spinner.succeed(`fetched ${entities.length.toLocaleString()} TLD records.`);
    } catch (error) {
        spinner.fail('Failed to fetch TLD records from db.');
        logger.error(error, 'Failed to fetch TLD records');
        cliOutput.errorAndExit((error as Error).message);
    }

    try {
        spinner.start('creating file...');
        const data: Record<
            string,
            {
                tld: string;
                whoisServer: string | null;
                rdapServers: string[] | null;
                lastChecked: Date;
            }
        > = {};
        for (const entity of entities) {
            if (entity.whoisServer || entity.rdapServers?.length) {
                data[entity.tld.slice(1)] = {
                    tld: entity.tld,
                    whoisServer: entity.whoisServer ?? null,
                    rdapServers: entity.rdapServers ?? null,
                    lastChecked: entity.updatedAt,
                };
            }
        }
        await bunFile.write(JSON.stringify(data, null, 2));
    } catch (error) {
        logger.error(error, 'Failed to create TLD records');
        cliOutput.errorAndExit((error as Error).message);
    }

    cliOutput.logAndExit('Done');
};

export const TldExportCommand = createTypedCommand(
    {
        command: 'tld:export',
        description: 'build tld.json from db data',
        options: [
            {
                flags: '-f, --file <path>',
                description: 'Path to write the exported JSON file (default: ./tld.json)',
            },
            {
                flags: '--force',
                description: 'Overwrite the output file without prompting',
            },
        ],
    },
    TldExportAction
);
