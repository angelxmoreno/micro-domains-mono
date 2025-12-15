import { CliLogger, CliOutputService, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';
import { DataSource, initializeDatabase, TopLevelDomainRepository } from '@repo/database';
import type { TldDtoInsert } from '@repo/shared-types';
import { TldCrawler, type TldRecord } from '@repo/tld-crawler';
import ora from 'ora';

const parseLimit = (limitArg?: string): number | undefined => {
    if (limitArg === undefined) {
        return undefined;
    }
    const value = Number(limitArg);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error('The optional [limit] argument must be a positive number.');
    }
    return Math.floor(value);
};

export const TldImportAction: TypedActionFunction<[limitArg?: string]> = async (limitArg, { container }) => {
    const logger = container.resolve(CliLogger);
    const database = container.resolve(DataSource);
    const cliOutput = container.resolve(CliOutputService);
    const tldCrawler = container.resolve(TldCrawler);
    const tldRepo = container.resolve(TopLevelDomainRepository);

    let limit: number | undefined;
    try {
        limit = parseLimit(limitArg);
    } catch (error) {
        cliOutput.error((error as Error).message);
        process.exit(1);
    }
    let records: TldRecord[] = [];
    const spinner = ora();
    try {
        spinner.start('fetching TLD records...');
        records = await tldCrawler.fetchAllTlds(limit);
        spinner.succeed(`fetched ${records.length.toLocaleString()} TLD records.`);
    } catch (error) {
        spinner.fail('Failed to fetch TLD records.');
        logger.error(error, 'Failed to fetch TLD records');
        cliOutput.error((error as Error).message);
        process.exit(1);
    }

    try {
        spinner.start('inserting TLD records...');
        await initializeDatabase(database, logger);
        const partials = records.map<TldDtoInsert>((record) => ({
            tld: record.tld,
            whoisServer: record.whoisServer,
            rdapServers: record.rdapServers,
        }));
        await tldRepo.batchUpsert(partials);
        records.forEach((record) => {
            const whois = record.whoisServer ?? 'n/a';
            const rdap = record.rdapServers.length > 0 ? record.rdapServers[0] : 'n/a';
            cliOutput.log(`${record.tld.padEnd(12)} | WHOIS: ${whois} | RDAP: ${rdap}`);
        });
        cliOutput.log(`Imported ${records.length} TLD records${limit ? ` (limit ${limit})` : ''}.`);
    } catch (error) {
        logger.error(error, 'Failed to import TLD records');
        cliOutput.error((error as Error).message);
        process.exit(1);
    }
};

export const TldImportCommand = createTypedCommand(
    {
        command: 'tld:import',
        description: 'Fetch WHOIS/RDAP information for top-level domains using the IANA dataset.',
        arguments: [
            {
                name: '[limit]',
                description: 'Optionally limit the crawl to the first N TLD entries.',
            },
        ],
    },
    TldImportAction
);
