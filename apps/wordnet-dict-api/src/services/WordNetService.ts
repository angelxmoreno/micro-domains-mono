import { resolve } from 'node:path';
import type { WordNetDB, WordNetDBFile } from 'wordnet-db';
import { files as wordNetDBFiles } from 'wordnet-db';

const WORDNET_FILE_SET = new Set<WordNetDBFile>(wordNetDBFiles);

export type WordNetPOS = 'n' | 'v' | 'a' | 'r'; // noun, verb, adjective, adverb

export type WordRelationType =
    | 'antonym'
    | 'hypernym'
    | 'hyponym'
    | 'holonym'
    | 'meronym'
    | 'similarTo'
    | 'entailment'
    | 'cause'
    | 'alsoSee'
    | 'verbGroup';

export type Synset = {
    offset: string;
    definition: string;
    examples: string[];
    relations?: Record<WordRelationType, string[]>;
    frequency?: number;
    senseKey?: string;
};

export type WordData = {
    word: string;
    partOfSpeech: WordNetPOS;
    synsets: Synset[];
};

export class WordNetService {
    constructor(protected db: WordNetDB) {}

    get info(): WordNetDB {
        return this.db;
    }

    getFilePath(file: WordNetDBFile): string {
        if (!WORDNET_FILE_SET.has(file)) {
            throw new Error(`Invalid file: ${file}`);
        }
        return resolve(this.db.path, file);
    }

    /** Stream lines from a file in Bun safely */
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

    /** Find first line in a file matching a predicate */
    protected async streamFindLine(file: WordNetDBFile, predicate: (line: string) => boolean): Promise<string | null> {
        const path = this.getFilePath(file);
        for await (const line of this.streamLines(path)) {
            if (predicate(line)) return line;
        }
        return null;
    }

    /** Read all lines from a file (for index listing) */
    protected async getFileLines(file: WordNetDBFile): Promise<string[]> {
        const path = this.getFilePath(file);
        const lines: string[] = [];
        for await (const line of this.streamLines(path)) {
            lines.push(line);
        }
        return lines;
    }

    protected async getFileLineWords(file: WordNetDBFile) {
        const words: string[] = [];
        for await (const word of this.getFileLineWordsStream(file)) {
            words.push(word);
        }
        return words;
    }
    private async findWordIndex(
        word: string,
        pos: WordNetPOS
    ): Promise<{
        word: string;
        offsets: string[];
        pos: WordNetPOS;
        frequency: number;
        senseKeys: string[];
    } | null> {
        const indexFileMap: Record<WordNetPOS, WordNetDBFile> = {
            n: 'index.noun',
            v: 'index.verb',
            a: 'index.adj',
            r: 'index.adv',
        };

        const indexLine = await this.streamFindLine(indexFileMap[pos], (line) => line.startsWith(`${word} `));
        if (!indexLine) return null;

        const parts = indexLine.split(/\s+/);
        const synsetCount = parseInt(parts[2] ?? '0', 10) || 0;

        // Grab the last `synsetCount` items of the line: these are the actual synset offsets
        const synsetOffsets = parts.slice(-synsetCount);

        // Frequency (use 0 as fallback)
        const frequency = parseInt(parts[parts.length - 1] ?? '0', 10);

        // Construct senseKeys (simplified)
        const senseKeys = synsetOffsets.map((offset) => `${word}%${pos}:${offset}::`);

        return {
            word,
            offsets: synsetOffsets,
            pos,
            frequency,
            senseKeys,
        };
    }

    private async findSynsetData(offset: string, pos: WordNetPOS): Promise<{ definition: string; examples: string[] }> {
        const dataFileMap: Record<WordNetPOS, WordNetDBFile> = {
            n: 'data.noun',
            v: 'data.verb',
            a: 'data.adj',
            r: 'data.adv',
        };

        const line = await this.streamFindLine(dataFileMap[pos], (l) => l.startsWith(offset));
        if (!line) return { definition: '', examples: [] };

        const glossPart = (line.split('|')[1] ?? '').trim();
        const exampleMatches = glossPart.match(/"([^"]+)"/g) ?? [];
        const examples: string[] = exampleMatches.map((ex) => ex.replace(/"/g, '').trim()); // flatten here
        const definition = glossPart.replace(/"[^"]+"/g, '').trim();

        return { definition, examples };
    }

    private async getWordData(word: string, pos: WordNetPOS): Promise<WordData | null> {
        const index = await this.findWordIndex(word, pos);
        if (!index) return null;

        const synsets = [];

        for (let i = 0; i < index.offsets.length; i++) {
            const offset = index.offsets[i];
            if (!offset) continue; // skip undefined offsets

            const synsetData = await this.findSynsetData(offset, pos);

            synsets.push({
                offset,
                definition: synsetData.definition,
                examples: synsetData.examples,
                frequency: index.frequency,
                senseKey: index.senseKeys[i] ?? '',
            });
        }

        return {
            word,
            partOfSpeech: pos,
            synsets,
        };
    }

    /** Nouns */
    async getNoun(word: string): Promise<WordData | null> {
        return this.getWordData(word, 'n');
    }

    /** Verbs */
    async getVerb(word: string): Promise<WordData | null> {
        return this.getWordData(word, 'v');
    }

    /** Adjectives */
    async getAdjective(word: string): Promise<WordData | null> {
        return this.getWordData(word, 'a');
    }

    /** Adverbs */
    async getAdverb(word: string): Promise<WordData | null> {
        return this.getWordData(word, 'r');
    }

    /** List all words for a given POS */
    async getNouns(): Promise<string[]> {
        return this.getFileLineWords('index.noun');
    }

    async getVerbs(): Promise<string[]> {
        return this.getFileLineWords('index.verb');
    }

    async getAdjectives(): Promise<string[]> {
        return this.getFileLineWords('index.adj');
    }

    async getAdverbs(): Promise<string[]> {
        return this.getFileLineWords('index.adv');
    }

    async *getFileLineWordsStream(file: WordNetDBFile): AsyncGenerator<string> {
        let skipHeaders = true;

        for await (const line of this.streamLines(this.getFilePath(file))) {
            const word = line.trim().split(/\s+/)[0];
            if (!word || /^\d+$/.test(word) || word.startsWith('#')) continue;

            // Skip lines that are just numbers or headers
            if (skipHeaders && /^\d+$/.test(word)) continue;
            skipHeaders = false;

            yield word;
        }
    }
}
