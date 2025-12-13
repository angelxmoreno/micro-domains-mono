declare module 'wordnet' {
    export type PartOfSpeech = 'n' | 'v' | 'a' | 's' | 'r';

    export interface Word {
        word: string;
        lexId: number;
    }

    export interface Pointer {
        pointerSymbol: string;
        synsetOffset: number;
        pos: PartOfSpeech;
        sourceTargetHex: string;
        data?: ParsedDataLine;
    }

    export interface ParsedDataLine {
        glossary: string;
        meta: {
            pos: PartOfSpeech;
            synsetOffset: number;
            lexFilenum: number;
            synsetType: string;
            wordCount: number;
            words: Word[];
            pointerCount: number;
            pointers: Pointer[];
        };
    }

    export interface IterateSynsetsOptions {
        skipPointers?: boolean;
    }

    export interface ParsedIndexLine {
        lemma: string;
        pos: PartOfSpeech;
        synsetCount: number;
        pointerCount: number;
        pointers: string[];
        senseCount: number;
        tagSenseCount: number;
        synsetOffsets: number[];
    }

    export function init(databaseDir?: string): Promise<void>;
    export function list(): string[];
    export function lookup(word: string, skipPointers?: boolean): Promise<ParsedDataLine[]>;
    export function listIndexEntries(): ParsedIndexLine[];
    export function iterateSynsets(pos?: PartOfSpeech, options?: IterateSynsetsOptions): AsyncGenerator<ParsedDataLine>;
}
