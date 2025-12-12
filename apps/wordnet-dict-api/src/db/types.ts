import type { Generated } from 'kysely';

export interface WordsTable {
    id: Generated<number>;
    lemma: string;
    pos: 'n' | 'v' | 'a' | 's' | 'r';
}

export interface SynsetsTable {
    id: Generated<number>;
    offset: string;
    pos: 'n' | 'v' | 'a' | 's' | 'r';
    definition: string;
    sense_key: string | null;
}

export interface WordSynsetsTable {
    id: Generated<number>;
    word_id: number;
    synset_id: number;
}

export interface ExamplesTable {
    id: Generated<number>;
    synset_id: number;
    text: string;
}

export interface RelationsTable {
    id: Generated<number>;
    synset_id: number;
    relation_type: string; // WordRelationType from types/WordNet
    target_offset: string;
}

export interface KyselyDatabase {
    words: WordsTable;
    synsets: SynsetsTable;
    word_synsets: WordSynsetsTable;
    examples: ExamplesTable;
    relations: RelationsTable;
}
