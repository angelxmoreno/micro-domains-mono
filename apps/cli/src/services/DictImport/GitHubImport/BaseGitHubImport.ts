import { resolve } from 'node:path';
import type { WordDtoInsert } from '@repo/shared-types';
import { cloneOrPull } from '../../../utils/cloneOrPull';
import { ImporterBase } from '../ImporterBase';
import type { ImporterInterface } from '../ImporterInterface';

export abstract class BaseGitHubImport extends ImporterBase implements ImporterInterface {
    protected abstract repoOwner: string;
    protected abstract repoName: string;
    protected abstract filePaths: string[];
    protected targetParentPath = './.repos';

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
            const trimmed = word.trim();
            if (!trimmed) continue;
            entities.push({
                name: trimmed,
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
