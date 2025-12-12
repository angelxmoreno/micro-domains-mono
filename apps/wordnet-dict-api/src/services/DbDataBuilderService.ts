import type { Kysely } from 'kysely';
import type { Logger } from 'pino';
import type { ParsedDataLine, Pointer, Word as WordnetWord } from 'wordnet';
import * as wordnet from 'wordnet';
import type { KyselyDatabase, RelationsTable, SynsetsTable, WordsTable } from '../db/types';

const INSERT_BATCH_SIZE = 1000;
const DELETE_BATCH_SIZE = 500;
const SYNSET_BATCH_SIZE = 750;

const pointerSymbolToRelationType: Record<string, string> = {
    '!': 'Antonym',
    '@': 'Hypernym',
    '@i': 'Instance Hypernym',
    '~': 'Hyponym',
    '~i': 'Instance Hyponym',
    '#m': 'Holonym (member)',
    '#s': 'Holonym (substance)',
    '#p': 'Holonym (part)',
    '%m': 'Meronym (member)',
    '%s': 'Meronym (substance)',
    '%p': 'Meronym (part)',
    '=': 'Attribute',
    '+': 'Derivationally Related Form',
    ';c': 'Domain of synset - TOPIC',
    '-c': 'Member of this domain - TOPIC',
    ';r': 'Domain of synset - REGION',
    '-r': 'Member of this domain - REGION',
    ';u': 'Domain of synset - USAGE',
    '-u': 'Member of this domain - USAGE',
    '*': 'Entailment',
    '>': 'Cause',
    '^': 'Also See',
    $: 'Verb Group',
    '&': 'Similar To',
    '<': 'Participle of Verb',
    '\u005C': 'Pertainym (derived from noun)',
};

const synsetTypeToPos: Record<string, SynsetsTable['pos']> = {
    noun: 'n',
    verb: 'v',
    adjective: 'a',
    'adjective satellite': 's',
    adverb: 'r',
};

const buildWordKey = (lemma: string, pos: WordsTable['pos']): string => `${lemma}::${pos}`;
const buildSynsetKey = (offset: SynsetsTable['offset'], pos: SynsetsTable['pos']): string => `${offset}::${pos}`;

type WordInsert = Omit<WordsTable, 'id'>;
type SynsetInsert = Omit<SynsetsTable, 'id'>;
type RelationInsert = Omit<RelationsTable, 'id'>;
type RelationPayload = Omit<RelationInsert, 'synset_id'>;

type Transaction = Kysely<KyselyDatabase>;

interface MappedSynsetEntry {
    synset: SynsetInsert;
    words: WordInsert[];
    examples: string[];
    relations: RelationPayload[];
}

interface DbData {
    mappedSynsetEntries: MappedSynsetEntry[];
}

export interface DbDataBuilderDependencies {
    logger: Logger;
    db: Kysely<KyselyDatabase>;
    wordnetDataDir: string;
}

export class DbDataBuilderService {
    private readonly logger: Logger;
    private readonly db: Kysely<KyselyDatabase>;
    private readonly dataDir: string;
    private isInitialized = false;

    constructor({ logger, db, wordnetDataDir }: DbDataBuilderDependencies) {
        this.logger = logger;
        this.db = db;
        this.dataDir = wordnetDataDir;
    }

    private async ensureWordnetReady(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        this.logger.info('Initializing WordNet data files');
        await wordnet.init(this.dataDir);
        this.isInitialized = true;
    }

    async importEntireDictionary(limit?: number): Promise<number> {
        await this.ensureWordnetReady();
        if (limit !== undefined) {
            this.logger.info({ limit }, 'Starting limited WordNet import');
        } else {
            this.logger.info('Starting full WordNet import');
        }

        const batch: MappedSynsetEntry[] = [];
        let processedCount = 0;
        let stopEarly = false;

        const flushBatch = async (count?: number) => {
            if (batch.length === 0) {
                return;
            }
            const entries = count ? batch.splice(0, count) : batch.splice(0);
            if (entries.length === 0) {
                return;
            }
            await this.persistDbData({ mappedSynsetEntries: entries });
            processedCount += entries.length;
            this.logger.debug({ processedCount }, 'Persisted synset batch');
        };

        for await (const definition of wordnet.iterateSynsets(undefined, { skipPointers: true })) {
            const entry = this.mapDefinition(definition);
            if (!entry) {
                continue;
            }
            batch.push(entry);

            if (limit !== undefined) {
                const remaining = limit - processedCount;
                if (remaining <= 0) {
                    stopEarly = true;
                    break;
                }
                if (batch.length >= remaining) {
                    await flushBatch(remaining);
                    stopEarly = true;
                    break;
                }
            }

            if (batch.length >= SYNSET_BATCH_SIZE) {
                await flushBatch();
            }
        }

        if (!stopEarly && batch.length > 0) {
            await flushBatch();
        }

        const message = limit ? 'Completed WordNet import (limited run)' : 'Completed WordNet import';
        this.logger.info({ processedCount }, message);
        return processedCount;
    }

    private mapDefinition(definition: ParsedDataLine): MappedSynsetEntry | null {
        const pos = definition.meta.pos ?? synsetTypeToPos[definition.meta.synsetType];
        if (!pos) {
            this.logger.warn({ synsetType: definition.meta.synsetType }, 'Unknown synset type encountered');
            return null;
        }

        const offset = definition.meta.synsetOffset.toString();
        const { definitionText, examples } = this.extractDefinitionPieces(definition.glossary);
        const words = this.extractWords(definition.meta.words, pos);
        const relations = this.extractRelations(definition.meta.pointers);

        return {
            synset: {
                offset,
                pos,
                definition: definitionText,
                sense_key: null,
            },
            words,
            examples,
            relations,
        };
    }

    private extractWords(wordInfos: WordnetWord[], pos: WordsTable['pos']): WordInsert[] {
        const deduped = new Map<string, WordInsert>();
        for (const wordInfo of wordInfos) {
            const lemma = this.normalizeLemma(wordInfo.word);
            if (!lemma) {
                continue;
            }
            const key = buildWordKey(lemma, pos);
            if (deduped.has(key)) {
                continue;
            }
            deduped.set(key, {
                lemma,
                pos,
            });
        }
        return Array.from(deduped.values());
    }

    private extractRelations(pointers: Pointer[]): RelationPayload[] {
        const relationMap = new Map<string, RelationPayload>();
        for (const pointer of pointers) {
            const relationType = pointerSymbolToRelationType[pointer.pointerSymbol];
            if (!relationType) {
                continue;
            }
            const targetOffset = pointer.synsetOffset.toString();
            const key = `${relationType}::${targetOffset}`;
            if (relationMap.has(key)) {
                continue;
            }
            relationMap.set(key, {
                relation_type: relationType,
                target_offset: targetOffset,
            });
        }
        return Array.from(relationMap.values());
    }

    private extractDefinitionPieces(glossary: string): { definitionText: string; examples: string[] } {
        const matches = glossary.match(/"([^"]+)"/g) ?? [];
        const examples = matches.map((example) => example.replace(/"/g, '').trim()).filter((text) => text.length > 0);
        const definitionText = glossary.replace(/"[^"]+"/g, '').trim();
        return { definitionText, examples };
    }

    private normalizeLemma(word: string): string | null {
        if (!word) {
            return null;
        }
        const base = word.split('%')[0];
        if (!base) {
            return null;
        }
        const normalized = base.trim().toLowerCase().replace(/_/g, ' ');
        return normalized.length > 0 ? normalized : null;
    }

    private async persistDbData(dbData: DbData): Promise<void> {
        if (dbData.mappedSynsetEntries.length === 0) {
            return;
        }

        await this.db.transaction().execute(async (trx) => {
            const uniqueWords = new Map<string, WordInsert>();
            const uniqueSynsets = new Map<string, SynsetInsert>();

            for (const entry of dbData.mappedSynsetEntries) {
                const synsetKey = buildSynsetKey(entry.synset.offset, entry.synset.pos);
                if (!uniqueSynsets.has(synsetKey)) {
                    uniqueSynsets.set(synsetKey, entry.synset);
                }
                for (const word of entry.words) {
                    const key = buildWordKey(word.lemma, word.pos);
                    if (!uniqueWords.has(key)) {
                        uniqueWords.set(key, word);
                    }
                }
            }

            await this.insertWords(trx, Array.from(uniqueWords.values()));
            await this.insertSynsets(trx, Array.from(uniqueSynsets.values()));

            const wordIdMap = await this.loadWordIds(trx, Array.from(uniqueWords.values()));
            const synsetIdMap = await this.loadSynsetIds(trx, Array.from(uniqueSynsets.values()));

            await this.insertWordSynsets(trx, dbData, wordIdMap, synsetIdMap);
            await this.replaceExamples(trx, dbData, synsetIdMap);
            await this.replaceRelations(trx, dbData, synsetIdMap);
        });
    }

    private async insertWords(trx: Transaction, words: WordInsert[]): Promise<void> {
        if (words.length === 0) {
            return;
        }
        for (let i = 0; i < words.length; i += INSERT_BATCH_SIZE) {
            const batch = words.slice(i, i + INSERT_BATCH_SIZE);
            await trx
                .insertInto('words')
                .values(batch)
                .onConflict((oc) => oc.columns(['lemma', 'pos']).doNothing())
                .execute();
        }
    }

    private async insertSynsets(trx: Transaction, synsets: SynsetInsert[]): Promise<void> {
        if (synsets.length === 0) {
            return;
        }
        for (let i = 0; i < synsets.length; i += INSERT_BATCH_SIZE) {
            const batch = synsets.slice(i, i + INSERT_BATCH_SIZE);
            await trx
                .insertInto('synsets')
                .values(batch)
                .onConflict((oc) => oc.columns(['offset', 'pos']).doNothing())
                .execute();
        }
    }

    private async loadWordIds(trx: Transaction, words: WordInsert[]): Promise<Map<string, number>> {
        const ids = new Map<string, number>();
        if (words.length === 0) {
            return ids;
        }
        const uniqueLemmas = Array.from(new Set(words.map((word) => word.lemma)));
        if (uniqueLemmas.length === 0) {
            return ids;
        }
        const rows = await trx
            .selectFrom('words')
            .select(['id', 'lemma', 'pos'])
            .where('lemma', 'in', uniqueLemmas)
            .execute();
        for (const row of rows) {
            ids.set(buildWordKey(row.lemma, row.pos), row.id);
        }
        return ids;
    }

    private async loadSynsetIds(trx: Transaction, synsets: SynsetInsert[]): Promise<Map<string, number>> {
        const ids = new Map<string, number>();
        if (synsets.length === 0) {
            return ids;
        }
        const uniqueOffsets = Array.from(new Set(synsets.map((synset) => synset.offset)));
        if (uniqueOffsets.length === 0) {
            return ids;
        }
        const rows = await trx
            .selectFrom('synsets')
            .select(['id', 'offset', 'pos'])
            .where('offset', 'in', uniqueOffsets)
            .execute();
        for (const row of rows) {
            ids.set(buildSynsetKey(row.offset, row.pos), row.id);
        }
        return ids;
    }

    private async insertWordSynsets(
        trx: Transaction,
        dbData: DbData,
        wordIdMap: Map<string, number>,
        synsetIdMap: Map<string, number>
    ): Promise<void> {
        const links = new Set<string>();

        for (const entry of dbData.mappedSynsetEntries) {
            const synsetKey = buildSynsetKey(entry.synset.offset, entry.synset.pos);
            const synsetId = synsetIdMap.get(synsetKey);
            if (!synsetId) {
                continue;
            }
            for (const word of entry.words) {
                const wordKey = buildWordKey(word.lemma, word.pos);
                const wordId = wordIdMap.get(wordKey);
                if (!wordId) {
                    continue;
                }
                links.add(`${wordId}-${synsetId}`);
            }
        }

        if (links.size === 0) {
            return;
        }

        const linkRows: Array<{ word_id: number; synset_id: number }> = [];
        for (const link of links) {
            const [wordIdRaw, synsetIdRaw] = link.split('-');
            if (!wordIdRaw || !synsetIdRaw) {
                continue;
            }
            const word_id = Number(wordIdRaw);
            const synset_id = Number(synsetIdRaw);
            if (Number.isNaN(word_id) || Number.isNaN(synset_id)) {
                continue;
            }
            linkRows.push({ word_id, synset_id });
        }

        for (let i = 0; i < linkRows.length; i += INSERT_BATCH_SIZE) {
            const batch = linkRows.slice(i, i + INSERT_BATCH_SIZE);
            await trx
                .insertInto('word_synsets')
                .values(batch)
                .onConflict((oc) => oc.columns(['word_id', 'synset_id']).doNothing())
                .execute();
        }
    }

    private async replaceExamples(trx: Transaction, dbData: DbData, synsetIdMap: Map<string, number>): Promise<void> {
        const rows: Array<{ synset_id: number; text: string }> = [];
        for (const entry of dbData.mappedSynsetEntries) {
            const synsetKey = buildSynsetKey(entry.synset.offset, entry.synset.pos);
            const synsetId = synsetIdMap.get(synsetKey);
            if (!synsetId) {
                continue;
            }
            for (const example of entry.examples) {
                rows.push({ synset_id: synsetId, text: example });
            }
        }

        if (rows.length === 0) {
            return;
        }

        const affectedSynsetIds = Array.from(new Set(rows.map((row) => row.synset_id)));
        await this.deleteBySynsetIds(trx, 'examples', affectedSynsetIds);

        for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
            const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
            await trx.insertInto('examples').values(batch).execute();
        }
    }

    private async replaceRelations(trx: Transaction, dbData: DbData, synsetIdMap: Map<string, number>): Promise<void> {
        const rows: RelationInsert[] = [];
        for (const entry of dbData.mappedSynsetEntries) {
            const synsetKey = buildSynsetKey(entry.synset.offset, entry.synset.pos);
            const synsetId = synsetIdMap.get(synsetKey);
            if (!synsetId) {
                continue;
            }
            for (const relation of entry.relations) {
                rows.push({
                    synset_id: synsetId,
                    relation_type: relation.relation_type,
                    target_offset: relation.target_offset,
                });
            }
        }

        if (rows.length === 0) {
            return;
        }

        const affectedSynsetIds = Array.from(new Set(rows.map((row) => row.synset_id)));
        await this.deleteBySynsetIds(trx, 'relations', affectedSynsetIds);

        for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
            const batch = rows.slice(i, i + INSERT_BATCH_SIZE);
            await trx.insertInto('relations').values(batch).execute();
        }
    }

    private async deleteBySynsetIds(
        trx: Transaction,
        table: 'examples' | 'relations',
        synsetIds: number[]
    ): Promise<void> {
        if (synsetIds.length === 0) {
            return;
        }
        for (let i = 0; i < synsetIds.length; i += DELETE_BATCH_SIZE) {
            const batch = synsetIds.slice(i, i + DELETE_BATCH_SIZE);
            await trx.deleteFrom(table).where('synset_id', 'in', batch).execute();
        }
    }
}
