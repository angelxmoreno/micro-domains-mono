import pino from 'pino';
import pretty from 'pino-pretty';
import { db } from './db';
import { HttpService } from './services/HttpService';

const logger = pino(pretty()).child({ module: 'wordnet-http' });
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? '0.0.0.0';

const service = new HttpService({ logger, db, port, host });

service.start().catch((error) => {
    logger.error(error, 'Failed to start HTTP server');
    process.exit(1);
});
