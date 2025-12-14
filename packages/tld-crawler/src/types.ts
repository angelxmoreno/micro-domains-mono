import type Keyv from '@keyvhq/core';
import type { AxiosInstance } from 'axios';
import type { Logger } from 'pino';

export interface TldRecord {
    tld: string;
    whoisServer: string | null;
    rdapServers: string[];
}

export interface TldCrawlerOptions {
    client?: AxiosInstance;
    cache?: Keyv<string>;
    userAgent?: string;
    ttl?: number;
    logger?: Logger;
}
