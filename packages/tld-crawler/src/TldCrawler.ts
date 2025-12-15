import Keyv from '@keyvhq/core';
import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';
import type { TldCrawlerOptions, TldRecord } from './types';

const DEFAULT_USER_AGENT = 'tld-crawler/1.0 (+https://github.com/angelxmoreno/micro-domains-mono)';
const DEFAULT_CACHE_TTL = 60 * 60 * 24 * 1000;
const ROOT_DB_URL = 'https://www.iana.org/domains/root/db';

export class TldCrawler {
    protected readonly client: AxiosInstance;
    protected readonly cache: Keyv<string>;
    protected readonly logger: Logger;
    protected readonly ttl: number;

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
        this.ttl = ttl || DEFAULT_CACHE_TTL;
    }

    protected async fetchHtml(url: string): Promise<string> {
        const cached = await this.cache.get(url);
        if (cached) {
            this.logger.debug({ url }, 'Serving cached response');
            return cached;
        }
        this.logger.debug({ url }, 'Fetching URL');
        const response = await this.client.get<string>(url, { responseType: 'text' });
        await this.cache.set(url, response.data, this.ttl);
        return response.data;
    }

    async listTldLinks(): Promise<string[]> {
        this.logger.info('Fetching TLD index');
        const html = await this.fetchHtml(ROOT_DB_URL);
        const $ = cheerio.load(html);
        const links = new Set<string>();
        $('table.iana-table tbody tr td:first-child a').each((_idx, el) => {
            const href = $(el).attr('href');
            if (!href) {
                return;
            }
            const absolute = new URL(href, ROOT_DB_URL).toString();
            links.add(absolute);
        });
        const result = Array.from(links);
        if (result.length === 0) {
            const error = new Error('Failed to discover TLD detail links');
            this.logger.error({ url: ROOT_DB_URL }, error.message);
            throw error;
        }
        this.logger.info({ count: result.length }, 'Discovered TLD detail links');
        return result;
    }

    async fetchTldRecord(tldUrl: string): Promise<TldRecord> {
        this.logger.debug({ tldUrl }, 'Fetching TLD record');
        const html = await this.fetchHtml(tldUrl);
        const $ = cheerio.load(html);
        const rawHeading =
            $('span.domain.tld').text().trim() ||
            $('.page-header h1').first().text().trim() ||
            $('h1').first().text().trim();
        if (!rawHeading) {
            const error = new Error('Failed to parse TLD from detail page');
            this.logger.error({ tldUrl }, error.message);
            throw error;
        }
        const extracted = rawHeading.match(/\.[a-z0-9-]+/i);
        const fallbackFromUrl = () => {
            const { pathname } = new URL(tldUrl);
            const slug = pathname.substring(pathname.lastIndexOf('/') + 1).replace(/\.html$/, '');
            return slug ? `.${slug}` : '';
        };
        const normalized = ((extracted ? extracted[0] : fallbackFromUrl()) || '').toLowerCase();
        if (!normalized) {
            const error = new Error('Failed to derive TLD from detail URL');
            this.logger.error({ tldUrl }, error.message);
            throw error;
        }
        const tld = normalized;
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

        if (!whoisServer) {
            const body = $('body').text();
            const whoisMatch = body.match(/whois server:\s*([^\s]+)/i);
            if (whoisMatch?.[1]) {
                whoisServer = whoisMatch[1].trim();
            }
        }

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

        if (rdapServers.length === 0) {
            const body = $('body').text();
            const rdapMatch = body.match(/rdap server:\s*([^\s]+)/i);
            if (rdapMatch?.[1]) {
                rdapServers.push(rdapMatch[1].trim());
            }
        }

        const record: TldRecord = {
            tld,
            whoisServer,
            rdapServers,
        };
        this.logger.debug({ tld, hasWhois: Boolean(whoisServer), rdapCount: rdapServers.length }, 'Fetched TLD record');
        return record;
    }

    async fetchAllTlds(limit?: number): Promise<TldRecord[]> {
        const links = await this.listTldLinks();
        const subset = limit ? links.slice(0, limit) : links;
        const results: TldRecord[] = [];
        let failures = 0;
        this.logger.info({ total: subset.length }, 'Starting crawl of TLD detail pages');

        for (const link of subset) {
            try {
                const record = await this.fetchTldRecord(link);
                results.push(record);
            } catch (error) {
                failures += 1;
                this.logger.error({ link, error }, 'Failed to fetch TLD page');
            }
        }

        if (results.length === 0) {
            const error = new Error('No TLD records were fetched');
            this.logger.error({ failures }, error.message);
            throw error;
        }

        this.logger.info({ total: results.length, failures }, 'Completed crawl of TLD pages');
        return results;
    }
}
