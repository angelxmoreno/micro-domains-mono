import Keyv from '@keyvhq/core';
import KeyvSQLite from '@keyvhq/sqlite';
import pino from 'pino';
import pretty from 'pino-pretty';
import { TldCrawler } from './TldCrawler';
import type { TldRecord } from './types';

const logger = pino(pretty());
const cache = new Keyv<string>({ store: new KeyvSQLite('sqlite:database.sqlite') });
const crawler = new TldCrawler({ logger, cache });

crawler
    .fetchAllTlds(4)
    .then((records: TldRecord[]) => {
        logger.info({ count: records.length, records }, 'Fetched TLD records');
    })
    .catch((error) => {
        logger.error(error, 'Failed to crawl TLD records');
        process.exit(1);
    });
