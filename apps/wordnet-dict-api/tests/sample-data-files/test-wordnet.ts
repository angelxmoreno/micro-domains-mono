import { files, type WordNetDB } from 'wordnet-db';

export const testWordNet: WordNetDB = {
    libVersion: 'test-1.0',
    version: 'test-1.0',
    path: 'apps/wordnet-dict-api/tests/sample-data-files/dict',
    files: [...files],
};
