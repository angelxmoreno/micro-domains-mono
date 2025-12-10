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
    word: string;
    examples: string[];
    partOfSpeech: WordNetPOS;
    definition: string;
    relations?: Record<WordRelationType, string[]>;
    frequency?: number;
    senseKey?: string;
};

export type WordData = {
    word: string;
    partOfSpeech: WordNetPOS;
    synsets: Synset[];
};
