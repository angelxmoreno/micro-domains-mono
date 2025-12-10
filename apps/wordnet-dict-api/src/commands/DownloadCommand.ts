import { type AppCommand, CliLogger, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';

export const DownloadAction: TypedActionFunction<[]> = async ({ container }): Promise<void> => {
    const logger = container.resolve(CliLogger);
    logger.info('download started');
};

export const DownloadCommand: AppCommand = createTypedCommand(
    {
        command: 'download',
        description: 'downloads wordnet data',
    },
    DownloadAction
);
