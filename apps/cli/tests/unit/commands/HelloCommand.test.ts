import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AppConfig, AppLogger } from '@repo/config-builder';
import type { RepoConfig } from '@repo/shared-types';
import type { Logger } from 'pino';
import { container, type DependencyContainer } from 'tsyringe';
import { helloAction } from '../../../src/commands/HelloCommand';
import { CliOutputService } from '../../../src/services/CliOutputService';

// Define a simple mock for CliOutputService
const mockCliOutput = {
    log: mock(() => {}),
    error: mock(() => {}),
};

// Define a simple mock for AppLogger
const mockAppLogger = {
    debug: mock(() => {}),
};

describe('helloAction', () => {
    let testContainer: DependencyContainer;

    beforeEach(() => {
        // Create an isolated child container for each test
        testContainer = container.createChildContainer();

        // Register our mocks on the test container
        testContainer.register(AppLogger, { useValue: mockAppLogger as unknown as Logger });
        testContainer.register(CliOutputService, { useValue: mockCliOutput as unknown as CliOutputService });
        testContainer.register(AppConfig, {
            useValue: { nodeEnv: { env: 'test' }, logger: { level: 'silent' } } as RepoConfig,
        });

        // Clear mocks before each test
        mockCliOutput.log.mockClear();
        mockCliOutput.error.mockClear();
        mockAppLogger.debug.mockClear();
    });

    it('should log "Hello World!" when no name is provided', async () => {
        const options = { container: testContainer };
        await helloAction(undefined, options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith('Hello World!');
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'World' }, options }, 'arguments received');
    });

    it('should log "Hello Alice!" when "Alice" is provided as the name', async () => {
        const options = { container: testContainer };
        await helloAction('Alice', options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith('Hello Alice!');
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'Alice' }, options }, 'arguments received');
    });

    it('should log debug information with provided name and options', async () => {
        const name = 'Bob';
        const options = { container: testContainer, verbose: true };
        await helloAction(name, options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith(`Hello ${name}!`);
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'Bob' }, options }, 'arguments received');
    });
});
