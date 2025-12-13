import { AppLogger } from '@repo/config-builder';
import { WordsRepository } from '@repo/database';
import type { WordDtoInsert } from '@repo/shared-types';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';
import * as wordnet from 'wordnet';
import wordnetDb from 'wordnet-db';
import { ImporterBase } from './ImporterBase';
import type { ImporterInterface } from './ImporterInterface';

@singleton()
export class WordNetImport extends ImporterBase implements ImporterInterface {
    readonly name: string = 'WordNet';
    protected static readonly CHUNK_SIZE = 2000;

    constructor(@inject(AppLogger) logger: Logger, @inject(WordsRepository) wordsRepo: WordsRepository) {
        super(logger.child({ module: 'WordNetImport' }), wordsRepo);
    }

    async run(): Promise<void> {
        await wordnet.init(wordnetDb.path);
        const allWords = wordnet.list();

        for (const chunk of this.wordsAsChunk(allWords, WordNetImport.CHUNK_SIZE)) {
            const payload: WordDtoInsert[] = chunk.map((name) => ({
                name,
                source: this.name,
            }));
            await this.wordsRepo.bulkInsertIfNotExists(payload);
        }
    }

    *wordsAsChunk<T>(arr: T[], n: number): Generator<T[], void> {
        for (let i = 0; i < arr.length; i += n) {
            yield arr.slice(i, i + n);
        }
    }
}
