import { Hono } from 'hono';
import type { Kysely } from 'kysely';
import type { Logger } from 'pino';
import type { KyselyDatabase, SynsetsTable } from '../db/types';

interface SynsetRow {
    synsetId: number;
    offset: SynsetsTable['offset'];
    pos: SynsetsTable['pos'];
    definition: SynsetsTable['definition'];
}

interface LemmaEntry {
    offset: string;
    pos: SynsetsTable['pos'];
    definition: string;
    examples: string[];
    synonyms: string[];
    antonyms: string[];
}

export interface HttpServiceDependencies {
    logger: Logger;
    db: Kysely<KyselyDatabase>;
    port?: number;
    host?: string;
}

export class HttpService {
    private readonly logger: Logger;
    private readonly db: Kysely<KyselyDatabase>;
    private readonly port: number;
    private readonly host: string;
    private readonly app: Hono;
    private server?: ReturnType<typeof Bun.serve>;

    constructor({ logger, db, port, host }: HttpServiceDependencies) {
        this.logger = logger;
        this.db = db;
        this.port = port ?? Number.parseInt(process.env.PORT ?? '3000', 10);
        this.host = host ?? process.env.HOST ?? '0.0.0.0';
        this.app = this.createApp();
    }

    private createApp(): Hono {
        const app = new Hono();

        app.get('/', (c) =>
            c.json({
                service: 'wordnet-dict-api',
                version: '1.0.0',
                endpoints: ['/healthz', '/define', '/synonyms', '/antonyms', '/pos'],
            })
        );

        app.get('/healthz', (c) => c.json({ status: 'ok' }));

        app.get('/define', async (c) => {
            const wordParam = c.req.query('word');
            const normalizedWord = this.normalizeLemma(wordParam);
            if (!normalizedWord) {
                return c.json(this.createMissingWordResponse(wordParam), 400);
            }

            const payload = await this.buildLemmaEntries(normalizedWord);
            if (!payload) {
                return c.json({ error: `Word "${wordParam}" was not found in the dictionary.` }, 404);
            }

            return c.json({ lemma: normalizedWord, entries: payload });
        });

        app.get('/synonyms', async (c) => {
            const wordParam = c.req.query('word');
            const normalizedWord = this.normalizeLemma(wordParam);
            if (!normalizedWord) {
                return c.json(this.createMissingWordResponse(wordParam), 400);
            }

            const payload = await this.buildLemmaEntries(normalizedWord);
            if (!payload) {
                return c.json({ error: `Word "${wordParam}" was not found in the dictionary.` }, 404);
            }

            return c.json({
                lemma: normalizedWord,
                entries: payload.map((entry) => ({
                    offset: entry.offset,
                    pos: entry.pos,
                    synonyms: entry.synonyms,
                })),
            });
        });

        app.get('/antonyms', async (c) => {
            const wordParam = c.req.query('word');
            const normalizedWord = this.normalizeLemma(wordParam);
            if (!normalizedWord) {
                return c.json(this.createMissingWordResponse(wordParam), 400);
            }

            const payload = await this.buildLemmaEntries(normalizedWord);
            if (!payload) {
                return c.json({ error: `Word "${wordParam}" was not found in the dictionary.` }, 404);
            }

            return c.json({
                lemma: normalizedWord,
                entries: payload.map((entry) => ({
                    offset: entry.offset,
                    pos: entry.pos,
                    antonyms: entry.antonyms,
                })),
            });
        });

        app.get('/pos', async (c) => {
            const wordParam = c.req.query('word');
            const normalizedWord = this.normalizeLemma(wordParam);
            if (!normalizedWord) {
                return c.json(this.createMissingWordResponse(wordParam), 400);
            }

            const synsets = await this.fetchSynsets(normalizedWord);
            if (synsets.length === 0) {
                return c.json({ error: `Word "${wordParam}" was not found in the dictionary.` }, 404);
            }

            const partsOfSpeech = Array.from(new Set(synsets.map((row) => row.pos)));
            return c.json({ lemma: normalizedWord, partsOfSpeech });
        });

        app.notFound((c) => c.json({ error: 'Route not found' }, 404));

        app.onError((err, c) => {
            this.logger.error(err, 'Unhandled HTTP error');
            return c.json({ error: 'Unexpected server error' }, 500);
        });

        return app;
    }

    async start(): Promise<void> {
        if (this.server) {
            this.logger.warn('HTTP server is already running');
            return;
        }

        this.server = Bun.serve({
            hostname: this.host,
            port: this.port,
            fetch: this.app.fetch,
        });

        this.logger.info({ host: this.host, port: this.port }, 'HTTP server is listening');
    }

    async stop(): Promise<void> {
        if (!this.server) {
            return;
        }
        this.server.stop();
        this.server = undefined;
        this.logger.info('HTTP server stopped');
    }

    private createMissingWordResponse(wordParam: string | null | undefined) {
        return {
            error: 'Missing required "word" query parameter',
            details: 'Use /path?word=example to fetch data for a specific lemma.',
            received: wordParam ?? null,
        };
    }

    private normalizeLemma(value?: string | null): string | null {
        if (!value) {
            return null;
        }
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        return trimmed.replace(/_/g, ' ').toLowerCase();
    }

    private async buildLemmaEntries(lemma: string): Promise<LemmaEntry[] | null> {
        const synsets = await this.fetchSynsets(lemma);
        if (synsets.length === 0) {
            return null;
        }
        const synsetIds = synsets.map((row) => row.synsetId);

        const [examples, synonyms, antonyms] = await Promise.all([
            this.fetchExamples(synsetIds),
            this.fetchSynonyms(synsetIds, lemma),
            this.fetchAntonyms(synsetIds),
        ]);

        return synsets.map((row) => ({
            offset: row.offset,
            pos: row.pos,
            definition: row.definition,
            examples: examples.get(row.synsetId) ?? [],
            synonyms: synonyms.get(row.synsetId) ?? [],
            antonyms: antonyms.get(row.synsetId) ?? [],
        }));
    }

    private async fetchSynsets(lemma: string): Promise<SynsetRow[]> {
        return this.db
            .selectFrom('synsets')
            .innerJoin('word_synsets', 'word_synsets.synset_id', 'synsets.id')
            .innerJoin('words', 'word_synsets.word_id', 'words.id')
            .select([
                'synsets.id as synsetId',
                'synsets.offset as offset',
                'synsets.pos as pos',
                'synsets.definition as definition',
            ])
            .where('words.lemma', '=', lemma)
            .orderBy('synsets.pos')
            .orderBy('synsets.offset')
            .execute();
    }

    private async fetchExamples(synsetIds: number[]): Promise<Map<number, string[]>> {
        const map = new Map<number, string[]>();
        if (synsetIds.length === 0) {
            return map;
        }

        const rows = await this.db
            .selectFrom('examples')
            .select(['examples.synset_id as synsetId', 'examples.text as text'])
            .where('examples.synset_id', 'in', synsetIds)
            .execute();

        for (const row of rows) {
            const bucket = map.get(row.synsetId) ?? [];
            bucket.push(row.text);
            map.set(row.synsetId, bucket);
        }

        return map;
    }

    private async fetchSynonyms(synsetIds: number[], baseLemma: string): Promise<Map<number, string[]>> {
        const map = new Map<number, string[]>();
        if (synsetIds.length === 0) {
            return map;
        }

        const rows = await this.db
            .selectFrom('word_synsets')
            .innerJoin('words', 'word_synsets.word_id', 'words.id')
            .select(['word_synsets.synset_id as synsetId', 'words.lemma as lemma'])
            .where('word_synsets.synset_id', 'in', synsetIds)
            .execute();

        for (const row of rows) {
            if (!row.lemma || row.lemma === baseLemma) {
                continue;
            }
            const bucket = map.get(row.synsetId) ?? [];
            if (!bucket.includes(row.lemma)) {
                bucket.push(row.lemma);
            }
            map.set(row.synsetId, bucket);
        }

        return map;
    }

    private async fetchAntonyms(synsetIds: number[]): Promise<Map<number, string[]>> {
        const map = new Map<number, string[]>();
        if (synsetIds.length === 0) {
            return map;
        }

        const relationRows = await this.db
            .selectFrom('relations')
            .select(['relations.synset_id as sourceSynsetId', 'relations.target_offset as targetOffset'])
            .where('relations.synset_id', 'in', synsetIds)
            .where('relations.relation_type', '=', 'Antonym')
            .execute();

        if (relationRows.length === 0) {
            return map;
        }

        const targetOffsets = Array.from(
            new Set(
                relationRows
                    .map((row) => row.targetOffset?.trim())
                    .filter((value): value is string => Boolean(value && value.length > 0))
            )
        );

        if (targetOffsets.length === 0) {
            return map;
        }

        const targetSynsets = await this.db
            .selectFrom('synsets')
            .select(['synsets.id as synsetId', 'synsets.offset as offset'])
            .where('synsets.offset', 'in', targetOffsets)
            .execute();

        if (targetSynsets.length === 0) {
            return map;
        }

        const offsetToSynsetIds = new Map<string, number[]>();
        for (const target of targetSynsets) {
            const bucket = offsetToSynsetIds.get(target.offset) ?? [];
            bucket.push(target.synsetId);
            offsetToSynsetIds.set(target.offset, bucket);
        }

        const allTargetSynsetIds = Array.from(new Set(targetSynsets.map((target) => target.synsetId)));
        const targetWords = await this.db
            .selectFrom('word_synsets')
            .innerJoin('words', 'word_synsets.word_id', 'words.id')
            .select(['word_synsets.synset_id as synsetId', 'words.lemma as lemma'])
            .where('word_synsets.synset_id', 'in', allTargetSynsetIds)
            .execute();

        const wordsBySynset = new Map<number, string[]>();
        for (const row of targetWords) {
            if (!row.lemma) {
                continue;
            }
            const bucket = wordsBySynset.get(row.synsetId) ?? [];
            if (!bucket.includes(row.lemma)) {
                bucket.push(row.lemma);
            }
            wordsBySynset.set(row.synsetId, bucket);
        }

        for (const relation of relationRows) {
            const lookupSynsetIds = offsetToSynsetIds.get(relation.targetOffset ?? '');
            if (!lookupSynsetIds || lookupSynsetIds.length === 0) {
                continue;
            }
            const antonymsForRelation = lookupSynsetIds.flatMap((id) => wordsBySynset.get(id) ?? []);
            if (antonymsForRelation.length === 0) {
                continue;
            }
            const bucket = map.get(relation.sourceSynsetId) ?? [];
            for (const lemma of antonymsForRelation) {
                if (!bucket.includes(lemma)) {
                    bucket.push(lemma);
                }
            }
            map.set(relation.sourceSynsetId, bucket);
        }

        return map;
    }
}
