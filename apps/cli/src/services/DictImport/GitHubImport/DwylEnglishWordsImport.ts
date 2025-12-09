import { AppLogger } from '@repo/config-builder';
import { WordsRepository } from '@repo/database';
import type { Logger } from 'pino';
import { inject, singleton } from 'tsyringe';
import { BaseGitHubImport } from './BaseGitHubImport';

@singleton()
export class DwylEnglishWordsImport extends BaseGitHubImport {
    static override name = 'DwylEnglishWords';
    protected filePaths: string[] = ['words_alpha.txt'];
    protected repoOwner = 'dwyl';
    protected repoName = 'english-words';

    constructor(@inject(AppLogger) logger: Logger, @inject(WordsRepository) wordsRepo: WordsRepository) {
        super(logger.child({ module: 'DwylEnglishWordsImport' }), wordsRepo);
    }
}
