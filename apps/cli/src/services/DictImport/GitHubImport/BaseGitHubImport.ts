import { resolve } from 'node:path';
import type { WordsRepository } from '@repo/database';
import type { WordDtoInsert } from '@repo/shared-types';
import type { Logger } from 'pino';
import { cloneOrPull } from '../../../utils/cloneOrPull';

export abstract class BaseGitHubImport {
    protected logger: Logger;
    protected abstract repoOwner: string;
    protected abstract repoName: string;
    protected abstract filePaths: string[];
    protected targetParentPath = './.repos';
    protected wordsRepo: WordsRepository;

    protected constructor(logger: Logger, wordsRepo: WordsRepository) {
        this.logger = logger;
        this.wordsRepo = wordsRepo;
    }

    get repoUrl(): string {
        return `https://github.com/${this.repoOwner}/${this.repoName}`;
    }

    get targetDir(): string {
        return resolve(this.targetParentPath, `${this.repoOwner}-${this.repoName}`);
    }

    protected resolvePath(filePath: string) {
        return resolve(this.targetDir, filePath);
    }

    protected async processContents(fullContents: string): Promise<WordDtoInsert[]> {
        const entities: WordDtoInsert[] = [];
        const lines = fullContents.split('\n');
        for (const word of lines) {
            entities.push({
                name: word.trim(),
                source: `${this.repoOwner}/${this.repoName}`,
            });
        }

        return entities;
    }

    async run() {
        await cloneOrPull(this.repoUrl, this.targetDir);
        for (const filePath of this.filePaths) {
            const fullPath = this.resolvePath(filePath);
            const fullContents = await Bun.file(fullPath).text();
            const words = await this.processContents(fullContents);
            await this.wordsRepo.bulkInsertIfNotExists(words);
        }
    }
}
