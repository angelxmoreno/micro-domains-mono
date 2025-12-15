import { beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import Keyv from '@keyvhq/core';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import pino from 'pino';
import { TldCrawler } from '../src/TldCrawler';

const fixturesBaseUrl = new URL('./fixtures/', import.meta.url);
const fixture = (name: string) => readFileSync(new URL(name, fixturesBaseUrl), { encoding: 'utf8' });

describe('TldCrawler', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(axios);
    });

    it('lists TLD links from the root DB', async () => {
        mock.onGet('https://www.iana.org/domains/root/db').reply(200, fixture('root-index.html'));

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test' }) });
        const links = await crawler.listTldLinks();

        expect(links.length).toBeGreaterThan(0);
        expect(links.slice(0, 4)).toEqual([
            'https://www.iana.org/domains/root/db/aaa.html',
            'https://www.iana.org/domains/root/db/aarp.html',
            'https://www.iana.org/domains/root/db/abarth.html',
            'https://www.iana.org/domains/root/db/abb.html',
        ]);
    });

    it('parses WHOIS and RDAP data for a single TLD (span selector)', async () => {
        mock.onGet('https://www.iana.org/domains/root/db/com.html').reply(200, fixture('tld-with-span.html'));

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-detail' }) });
        const record = await crawler.fetchTldRecord('https://www.iana.org/domains/root/db/com.html');

        expect(record).toEqual({
            tld: '.com',
            whoisServer: 'whois.example.com',
            rdapServers: ['https://rdap.example.com'],
        });
    });

    it('parses WHOIS and RDAP data when only h1 contains a sentence', async () => {
        mock.onGet('https://www.iana.org/domains/root/db/net.html').reply(200, fixture('tld-aaa.html'));

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-h1' }) });
        const record = await crawler.fetchTldRecord('https://www.iana.org/domains/root/db/net.html');

        expect(record.tld).toEqual('.net');
        expect(record.whoisServer).toEqual('whois.verisign-grs.com');
        expect(record.rdapServers).toContain('https://rdap.verisign.com/net/v1/');
    });

    it('throws when TLD detail page cannot be parsed', async () => {
        mock.onGet('https://www.iana.org/domains/root/db/bad.html').reply(200, fixture('tld-bad.html'));

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-bad-detail' }) });
        await expect(crawler.fetchTldRecord('https://www.iana.org/domains/root/db/bad.html')).rejects.toThrow(
            'Failed to parse TLD from detail page'
        );
    });

    it('supports injecting a logger and reports errors during crawl', async () => {
        const html = `
            <table class="iana-table">
                <tbody>
                    <tr><td><a href="/domains/root/db/bad.html">bad</a></td></tr>
                </tbody>
            </table>
        `;
        mock.onGet('https://www.iana.org/domains/root/db').reply(200, html);
        mock.onGet('https://www.iana.org/domains/root/db/bad.html').reply(500);

        const logger = pino({ enabled: false });
        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-error' }), logger });
        await expect(crawler.fetchAllTlds()).rejects.toThrow('No TLD records were fetched');
    });

    it('throws when no TLD links are discovered', async () => {
        const html = `
            <table class="iana-table">
                <tbody>
                </tbody>
            </table>
        `;
        mock.onGet('https://www.iana.org/domains/root/db').reply(200, html);

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-empty' }) });
        await expect(crawler.listTldLinks()).rejects.toThrow('Failed to discover TLD detail links');
    });
});
