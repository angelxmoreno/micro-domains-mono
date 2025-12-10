import { resolve } from 'node:path';
import { type WordNetDB, type WordNetDBFile, files as wordNetDBFiles } from 'wordnet-db';
import type { WordNetPOS, WordRelationType } from '../types/WordNet';

const WORDNET_FILE_SET = new Set<WordNetDBFile>(wordNetDBFiles);

export const indexFileMap: Record<WordNetPOS, WordNetDBFile> = {
    n: 'index.noun',
    v: 'index.verb',
    a: 'index.adj',
    r: 'index.adv',
};

// map pointer symbols to relation types (partial mapping)
export const relMap: Record<string, WordRelationType> = {
    '@': 'hypernym',
    '~': 'hyponym',
    '!': 'antonym',
    '*': 'alsoSee',
    '#m': 'holonym',
    '#s': 'meronym',
    '&': 'verbGroup',
    '>': 'entailment',
    '<': 'cause',
};

export class BaseWordNetService {
    protected db: WordNetDB;

    constructor(db: WordNetDB) {
        this.db = db;
    }

    get dictPath() {
        return this.db.path;
    }

    get info(): WordNetDB {
        return this.db;
    }

    getFilePath(file: WordNetDBFile): string {
        if (!WORDNET_FILE_SET.has(file)) {
            throw new Error(`Invalid file: ${file}`);
        }
        return resolve(this.dictPath, file);
    }

    protected async *streamLines(path: string): AsyncGenerator<string> {
        const decoder = new TextDecoder();
        const reader = Bun.file(path).stream().getReader();

        let { value, done } = await reader.read();
        let buffer = '';

        while (!done) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                yield line;
            }

            ({ value, done } = await reader.read());
        }

        if (buffer) yield buffer;
    }

    /** yield all words for a POS using the index file (skips header lines) */
    async *allWords(pos: WordNetPOS): AsyncGenerator<string> {
        for await (const line of this.streamLines(indexFileMap[pos])) {
            const w = line.trim().split(/\s+/)[0];
            if (!w) continue;
            if (/^\d+$/.test(w) || w.startsWith('#')) continue;
            yield w;
        }
    }
}
