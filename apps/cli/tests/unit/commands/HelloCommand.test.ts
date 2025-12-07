import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { pino } from 'pino';
import { helloAction } from '../../../src/commands/HelloCommand';

// Mock pino to capture log calls
const infoLogger = mock(() => {});
const debugLogger = mock(() => {});

const mockPino = {
    info: infoLogger,
    debug: debugLogger,
    // Mock other pino methods if they were used, e.g., error, warn
} as unknown as ReturnType<typeof pino>;

// Mock the pino module to return our mockPino instance
mock.module('pino', () => ({
    pino: () => mockPino,
}));

describe('helloAction', () => {
    beforeEach(() => {
        // Reset mocks before each test
        infoLogger.mockClear();
        debugLogger.mockClear();
    });

    it('should log "Hello World!" when no name is provided', async () => {
        const options = {};
        await helloAction(undefined, options);

        expect(mockPino.info).toHaveBeenCalledTimes(1);
        expect(mockPino.info).toHaveBeenCalledWith('Hello World!');
        expect(mockPino.debug).toHaveBeenCalledTimes(1);
        expect(mockPino.debug).toHaveBeenCalledWith({ args: { name: 'World' }, options }, 'arguments received');
    });

    it('should log "Hello Alice!" when "Alice" is provided as the name', async () => {
        const options = {};
        await helloAction('Alice', options);

        expect(mockPino.info).toHaveBeenCalledTimes(1);
        expect(mockPino.info).toHaveBeenCalledWith('Hello Alice!');
        expect(mockPino.debug).toHaveBeenCalledTimes(1);
        expect(mockPino.debug).toHaveBeenCalledWith({ args: { name: 'Alice' }, options }, 'arguments received');
    });

    it('should log debug information with provided name and options', async () => {
        const name = 'Bob';
        const options = { verbose: true };
        await helloAction(name, options);

        expect(mockPino.debug).toHaveBeenCalledTimes(1);
        expect(mockPino.debug).toHaveBeenCalledWith({ args: { name: 'Bob' }, options }, 'arguments received');
    });
});
