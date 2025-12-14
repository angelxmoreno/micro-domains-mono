import pino from 'pino';
import pretty from 'pino-pretty';
import { TldCrawler } from './TldCrawler';

const logger = pino(pretty());
const crawler = new TldCrawler({ logger });
crawler
    .fetchAllTlds()
    .then((records) => {
        logger.info({ count: records.length }, 'Fetched TLD records');
    })
    .catch((error) => {
        logger.error(error, 'Failed to crawl TLD records');
        process.exit(1);
    });
