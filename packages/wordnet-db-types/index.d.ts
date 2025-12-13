declare module 'wordnet-db' {
    export const files: readonly [
        'data.adj',
        'data.adv',
        'data.noun',
        'data.verb',
        'index.noun',
        'index.adv',
        'index.adj',
        'index.verb',
        'index.sense',
    ];

    export type WordNetDBFile = (typeof files)[number];

    export interface WordNetDB {
        libVersion: string;
        version: string;
        path: string;
        files: typeof files;
    }

    const wordnetDb: WordNetDB;
    export default wordnetDb;
}
