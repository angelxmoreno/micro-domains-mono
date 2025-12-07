import type { Command } from 'commander';
import type { AppCommand } from './types.ts';

export const registerCommand = (program: Command, command: AppCommand) => {
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

    cmd.action(command.action);
};
