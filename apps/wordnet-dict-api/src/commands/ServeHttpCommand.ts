import {
    type AppCommand,
    CliLogger,
    CliOutputService,
    createTypedCommand,
    type TypedActionFunction,
} from '@repo/cli-helper';
import { db } from '../db';
import { HttpService, type HttpServiceDependencies } from '../services/HttpService';

interface ServeOptions extends Record<string, unknown> {
    port?: string;
    host?: string;
}

export const ServeHttpAction: TypedActionFunction<[], ServeOptions> = async ({ container, port, host }) => {
    const logger = container.resolve(CliLogger);
    const output = container.resolve(CliOutputService);
    const parsedPort = port ? Number(port) : undefined;
    if (parsedPort !== undefined && (!Number.isFinite(parsedPort) || parsedPort <= 0)) {
        output.log('The --port option must be a positive integer.');
        return;
    }

    const serviceDeps: HttpServiceDependencies = {
        logger,
        db,
        port: parsedPort,
        host,
    };
    const httpService = new HttpService(serviceDeps);
    await httpService.start();
    output.log(
        `HTTP server listening on http://${host ?? '0.0.0.0'}:${parsedPort ?? Number(process.env.PORT ?? 3000)}`
    );

    await new Promise(() => {});
};

export const ServeHttpCommand: AppCommand = createTypedCommand(
    {
        command: 'serve',
        description: 'Starts the WordNet HTTP API server.',
        options: [
            {
                flags: '-p, --port <number>',
                description: 'Port to bind the HTTP server to (default: 3000 or PORT env).',
            },
            {
                flags: '-H, --host <string>',
                description: 'Host/IP interface to bind to (default: 0.0.0.0).',
            },
        ],
    },
    ServeHttpAction
);
