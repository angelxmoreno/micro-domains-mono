import Keyv from '@keyvhq/core';
import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';
import type { TldCrawlerOptions, TldRecord } from './types';

const DEFAULT_USER_AGENT = 'tld-crawler/1.0 (+https://github.com/angelxmoreno/micro-domains-mono)';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
const ROOT_DB_URL = 'https://www.iana.org/domains/root/db';

export class TldCrawler {
    protected readonly client: AxiosInstance;
    protected readonly cache: Keyv<string>;
    protected readonly logger: Logger;

    constructor(options: undefined | TldCrawlerOptions = undefined) {
        const { client, userAgent, cache, ttl, logger } = options || {};
        this.client =
            client ||
            axios.create({
                headers: {
                    'User-Agent': userAgent || DEFAULT_USER_AGENT,
                },
            });

        this.cache =
            cache ||
            new Keyv<string>({
                ttl: ttl || DEFAULT_CACHE_TTL,
            });

        const baseLogger = logger || pino(pretty());
        this.logger = baseLogger.child({ module: TldCrawler });
    }

    protected async fetchHtml(url: string): Promise<string> {
        const cached = await this.cache.get(url);
        if (cached) {
            this.logger.debug({ url }, 'Serving cached response');
            return cached;
        }
        this.logger.debug({ url }, 'Fetching URL');
        const response = await this.client.get<string>(url, { responseType: 'text' });
        await this.cache.set(url, response.data);
        return response.data;
    }

    async listTldLinks(): Promise<string[]> {
        this.logger.info('Fetching TLD index');
        const html = await this.fetchHtml(ROOT_DB_URL);
        const $ = cheerio.load(html);
        const links = new Set<string>();
        $('table.tld-table tbody tr td:first-child a').each((_idx, el) => {
            const href = $(el).attr('href');
            if (!href) {
                return;
            }
            const absolute = new URL(href, ROOT_DB_URL).toString();
            links.add(absolute);
        });
        const result = Array.from(links);
        this.logger.info({ count: result.length }, 'Discovered TLD detail links');
        return result;
    }

    async fetchTldRecord(tldUrl: string): Promise<TldRecord> {
        this.logger.debug({ tldUrl }, 'Fetching TLD record');
        const html = await this.fetchHtml(tldUrl);
        const $ = cheerio.load(html);
        const tld = $('span.domain.tld').text().trim().toLowerCase();
        let whoisServer: string | null = null;
        const infoTableRows = $('table.whois tbody tr');
        infoTableRows.each((_idx, row) => {
            const heading = $(row).find('th').text().trim().toLowerCase();
            if (heading === 'whois server') {
                const value = $(row).find('td').text().trim();
                if (value) {
                    whoisServer = value;
                }
            }
        });

        const rdapServers: string[] = [];
        $('table.registry tbody tr').each((_idx, row) => {
            const heading = $(row).find('th').text().trim().toLowerCase();
            if (heading === 'url') {
                const url = $(row).find('td a').attr('href');
                if (url) {
                    rdapServers.push(url.trim());
                }
            }
        });

        const record: TldRecord = {
            tld,
            whoisServer,
            rdapServers,
        };
        this.logger.debug({ tld, hasWhois: Boolean(whoisServer), rdapCount: rdapServers.length }, 'Fetched TLD record');
        return record;
    }

    async fetchAllTlds(): Promise<TldRecord[]> {
        const links = await this.listTldLinks();
        const results: TldRecord[] = [];
        this.logger.info({ total: links.length }, 'Starting crawl of TLD detail pages');

        for (const link of links) {
            try {
                const record = await this.fetchTldRecord(link);
                results.push(record);
            } catch (error) {
                this.logger.error({ link, error }, 'Failed to fetch TLD page');
            }
        }

        this.logger.info({ total: results.length }, 'Completed crawl of TLD pages');
        return results;
    }
}
