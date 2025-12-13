import type { Command } from 'commander';
import type { DependencyContainer } from 'tsyringe';
import type { AppCommand } from './types.ts';

export const registerCommand = (program: Command, command: AppCommand, container: DependencyContainer) => {
    const cmd = program.command(command.command).description(command.description);

    if (command.options) {
        for (const option of command.options) {
            cmd.option(option.flags, option.description, option.defaultValue);
        }
    }

    if (command.arguments) {
        for (const arg of command.arguments) {
            cmd.argument(arg.name, arg.description, arg.defaultValue);
        }
    }

    // Wrap the original action to inject the container
    cmd.action((...args: unknown[]) => {
        // Commander passes arguments as: [...commandArgs, options, commandObject]
        const commandArgs = args.slice(0, -2);
        const options = args.at(-2) as Record<string, unknown>;
        const commandObject = args.at(-1);

        // Inject the container into the options object
        const extendedOptions = { ...options, container };

        // Call the original action with the modified arguments
        return command.action(...commandArgs, extendedOptions, commandObject);
    });
};
