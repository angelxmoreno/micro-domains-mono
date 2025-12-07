#!/usr/bin/env bun
import { Command } from 'commander';
import { pino } from 'pino';
import { helloProgram } from './commands/HelloCommand';
import { registerCommand } from './registerCommand';

const program = new Command();

program
    .name('repo-cli')
    .description('A CLI application')
    .version('1.0.0')
    .option('-d, --debug', 'output extra debugging information');

program.hook('preAction', () => {
    if (program.opts().debug) {
        // Register debug log level before any logger resolution
    }
});

// Register commands
registerCommand(program, helloProgram);

// Error handling
program.exitOverride();

try {
    await program.parseAsync(process.argv); // Use parseAsync and await it
    process.exit(0); // Exit successfully after async operations complete
} catch (error: unknown) {
    // Resolve logger here, after parseAsync/preAction has run
    const logger = pino();

    if (error instanceof Error && 'code' in error) {
        if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
            process.exit(0);
        }
        if (error.code === 'commander.version') {
            process.exit(0);
        }
    }

    logger.error(error, '❌ CLI Error:');
    process.exit(1);
}
