import { AppLogger } from '@repo/config-builder';
import { appContainer } from '../config';
import { CliOutputService } from '../services/CliOutputService';
import { createTypedCommand, type TypedActionFunction } from '../types';

export const helloAction: TypedActionFunction<[name?: string]> = async (name, options): Promise<void> => {
    const finalName = name ?? 'World';
    const logger = appContainer.resolve(AppLogger);
    const cliOutput = appContainer.resolve(CliOutputService);

    logger.debug({ args: { name: finalName }, options }, 'arguments received');
    cliOutput.log(`Hello ${finalName}!`);
};

export const helloProgram = createTypedCommand(
    {
        command: 'hello',
        description: 'says hello',
        arguments: [
            {
                name: '[name]',
                description: 'the person to greet',
                defaultValue: 'World',
            },
        ],
    },
    helloAction
);
