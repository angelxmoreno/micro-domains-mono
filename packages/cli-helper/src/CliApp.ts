import { Command } from 'commander';
import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';
import { container, type DependencyContainer, type InjectionToken } from 'tsyringe';
import { registerCommand } from './registerCommand';
import type { AppCommand } from './types';

export const CliLogger: InjectionToken<Logger> = 'CliLogger';

export interface CliAppOptions {
    name: string;
    description?: string;
    version?: string;
}

export interface CliAppParams extends CliAppOptions {
    container?: DependencyContainer;
    commands?: AppCommand[];
    logger?: Logger;
}

export class CliApp {
    protected program: Command;
    protected initOptions: CliAppOptions;
    protected container: DependencyContainer;
    protected commands: AppCommand[];
    protected logger: Logger;

    constructor({ logger, commands, container: c, ...options }: CliAppParams) {
        this.initOptions = options;
        this.commands = commands ?? [];
        this.container = c ?? container.createChildContainer();
        this.logger = logger ?? pino(pretty()).child({ module: options.name });
        this.container.registerInstance(CliLogger, this.logger);
    }

    getProgram(): Command {
        return this.program;
    }

    init() {
        const program = new Command();
        program.name(this.initOptions.name).option('-d, --debug', 'output extra debugging information');

        if (this.initOptions.description) {
            program.description(this.initOptions.description);
        }

        if (this.initOptions.version) {
            program.version(this.initOptions.version);
        }

        program.hook('preAction', () => {
            if (program.opts().debug) {
                this.container.resolve(CliLogger).level = 'debug';
            }
        });

        for (const command of this.commands) {
            registerCommand(program, command, this.container);
        }

        // Error handling
        program.exitOverride();
        this.program = program;
        return this;
    }

    async start() {
        try {
            await this.program.parseAsync(process.argv); // Use parseAsync and await it
            process.exit(0); // Exit successfully after async operations complete
        } catch (error: unknown) {
            // Resolve logger here, after parseAsync/preAction has run
            const logger = this.container.resolve(CliLogger);

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
    }
}
