import { type AppCommand, CliLogger, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';
import wordnetDb from 'wordnet-db';
import { WordNetService } from '../services/WordNetService';

export const DownloadAction: TypedActionFunction<[]> = async ({ container }): Promise<void> => {
    const logger = container.resolve(CliLogger);
    const service = new WordNetService(wordnetDb);
    const verb = await service.getVerb('abandon');
    logger.info({ verb });
};

export const DownloadCommand: AppCommand = createTypedCommand(
    {
        command: 'download',
        description: 'downloads wordnet data',
    },
    DownloadAction
);
