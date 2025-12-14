import type { WordsRepository } from '@repo/database';
import type { Logger } from 'pino';

export abstract class ImporterBase {
    abstract readonly name: string;
    protected logger: Logger;
    protected wordsRepo: WordsRepository;

    protected constructor(logger: Logger, wordsRepo: WordsRepository) {
        this.logger = logger;
        this.wordsRepo = wordsRepo;
    }
}
