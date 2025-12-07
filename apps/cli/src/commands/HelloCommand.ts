import { pino } from 'pino';
import { createTypedCommand, type TypedActionFunction } from '../types';

export const helloAction: TypedActionFunction<[name?: string]> = async (name, options): Promise<void> => {
    const finalName = name ?? 'World';
    // const logger = appContainer.resolve<Logger>(AppLogger);
    const logger = pino();
    logger.debug({ args: { name: finalName }, options }, 'arguments received');
    logger.info(`Hello ${finalName}!`);
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
