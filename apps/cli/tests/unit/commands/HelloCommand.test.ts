import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { AppConfig, AppLogger } from '@repo/config-builder';
import type { InjectionToken } from 'tsyringe'; // Import InjectionToken type
import { helloAction } from '../../../src/commands/HelloCommand';
import { appContainer } from '../../../src/config'; // Import the actual appContainer
import { CliOutputService } from '../../../src/services/CliOutputService'; // Import the new service

// Define a simple mock for CliOutputService
const mockCliOutput = {
    log: mock(() => {}),
    error: mock(() => {}),
};

// Define a simple mock for AppLogger (just the debug method for this test)
const mockAppLogger = {
    debug: mock(() => {}),
    // Add other logger methods if they are called in helloAction or need to be mocked
};

describe('helloAction', () => {
    let originalResolve: typeof appContainer.resolve;

    beforeEach(() => {
        originalResolve = appContainer.resolve;

        // Mock appContainer.resolve to return our mocks when requested
        appContainer.resolve = mock(<T>(token: InjectionToken<T>): T => {
            if (token === AppLogger) {
                return mockAppLogger as T;
            }
            if (token === CliOutputService) {
                return mockCliOutput as T;
            }
            if (token === AppConfig) {
                // Return a mock config object to satisfy the resolution
                return { nodeEnv: { env: 'test' }, logger: { level: 'silent' } } as T;
            }
            throw new Error(`Unexpected token resolution in test: ${String(token)}`);
        }) as typeof appContainer.resolve;

        // Clear mocks for CliOutputService
        mockCliOutput.log.mockClear();
        mockCliOutput.error.mockClear();
        // Clear mocks for AppLogger
        mockAppLogger.debug.mockClear();
    });

    afterEach(() => {
        // Restore original resolve method
        appContainer.resolve = originalResolve;
    });

    it('should log "Hello World!" when no name is provided', async () => {
        const options = {};
        await helloAction(undefined, options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith('Hello World!');
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'World' }, options }, 'arguments received');
    });

    it('should log "Hello Alice!" when "Alice" is provided as the name', async () => {
        const options = {};
        await helloAction('Alice', options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith('Hello Alice!');
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'Alice' }, options }, 'arguments received');
    });

    it('should log debug information with provided name and options', async () => {
        const name = 'Bob';
        const options = { verbose: true };
        await helloAction(name, options);

        expect(mockCliOutput.log).toHaveBeenCalledTimes(1);
        expect(mockCliOutput.log).toHaveBeenCalledWith(`Hello ${name}!`);
        expect(mockAppLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockAppLogger.debug).toHaveBeenCalledWith({ args: { name: 'Bob' }, options }, 'arguments received');
    });
});
