import { beforeEach, describe, expect, it } from 'bun:test';
import Keyv from '@keyvhq/core';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import pino from 'pino';
import { TldCrawler } from '../src/TldCrawler';

describe('TldCrawler', () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(axios);
    });

    it('lists TLD links from the root DB', async () => {
        const html = `
            <table class="tld-table">
                <tbody>
                    <tr><td><a href="/domains/root/db/com.html">com</a></td></tr>
                    <tr><td><a href="/domains/root/db/net.html">net</a></td></tr>
                </tbody>
            </table>
        `;
        mock.onGet('https://www.iana.org/domains/root/db').reply(200, html);

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test' }) });
        const links = await crawler.listTldLinks();

        expect(links).toEqual([
            'https://www.iana.org/domains/root/db/com.html',
            'https://www.iana.org/domains/root/db/net.html',
        ]);
    });

    it('parses WHOIS and RDAP data for a single TLD', async () => {
        const detailHtml = `
            <span class="domain tld">.COM</span>
            <table class="whois">
                <tbody>
                    <tr><th>WHOIS Server</th><td>whois.example.com</td></tr>
                </tbody>
            </table>
            <table class="registry">
                <tbody>
                    <tr><th>URL</th><td><a href="https://rdap.example.com" /></td></tr>
                </tbody>
            </table>
        `;
        mock.onGet('https://www.iana.org/domains/root/db/com.html').reply(200, detailHtml);

        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-detail' }) });
        const record = await crawler.fetchTldRecord('https://www.iana.org/domains/root/db/com.html');

        expect(record).toEqual({
            tld: '.com',
            whoisServer: 'whois.example.com',
            rdapServers: ['https://rdap.example.com'],
        });
    });

    it('supports injecting a logger and reports errors during crawl', async () => {
        const html = `
            <table class="tld-table">
                <tbody>
                    <tr><td><a href="/domains/root/db/bad.html">bad</a></td></tr>
                </tbody>
            </table>
        `;
        mock.onGet('https://www.iana.org/domains/root/db').reply(200, html);
        mock.onGet('https://www.iana.org/domains/root/db/bad.html').reply(500);

        const logger = pino({ enabled: false });
        const crawler = new TldCrawler({ client: axios, cache: new Keyv({ namespace: 'test-error' }), logger });
        const records = await crawler.fetchAllTlds();

        expect(records).toEqual([]);
    });
});
