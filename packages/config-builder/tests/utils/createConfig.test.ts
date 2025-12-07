import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { DeepPartial } from '@ts-types/deep-partial';
import { ZodError } from 'zod';
import { createConfig, NodeEnv, type RepoConfig, RepoConfigSchema } from '../../src';

describe('createConfig', () => {
    let originalBunEnvNodeEnv: string | undefined;

    beforeEach(() => {
        // Store the original process.env.NODE_ENV before each test
        originalBunEnvNodeEnv = process.env.NODE_ENV;
        // Reset process.env.NODE_ENV to ensure test isolation
        process.env.NODE_ENV = undefined;
    });

    // Restore original process.env.NODE_ENV after all tests in this suite are done
    // This is good practice but for Bun, each test file runs in its own process,
    // so it's less critical than in other runners. Still, good for clarity.
    afterEach(() => {
        process.env.NODE_ENV = originalBunEnvNodeEnv;
    });

    it('should return a default development config when no NODE_ENV is set and no overrides are provided', () => {
        const config = createConfig();

        expect(config.nodeEnv.env).toBe(NodeEnv.development);
        expect(config.nodeEnv.isDevelopment).toBe(true);
        expect(config.nodeEnv.isTesting).toBe(false);
        expect(() => RepoConfigSchema.parse(config)).not.toThrow();
    });

    it('should return a test config when NODE_ENV is set to "test"', () => {
        process.env.NODE_ENV = NodeEnv.test;
        const config = createConfig();

        expect(config.nodeEnv.env).toBe(NodeEnv.test);
        expect(config.nodeEnv.isDevelopment).toBe(false);
        expect(config.nodeEnv.isTesting).toBe(true);
        expect(() => RepoConfigSchema.parse(config)).not.toThrow();
    });

    it('should return a production config when NODE_ENV is set to "production"', () => {
        process.env.NODE_ENV = NodeEnv.production;
        const config = createConfig();

        expect(config.nodeEnv.env).toBe(NodeEnv.production);
        expect(config.nodeEnv.isDevelopment).toBe(false);
        expect(config.nodeEnv.isTesting).toBe(false);
        expect(() => RepoConfigSchema.parse(config)).not.toThrow();
    });

    it('should merge overrides correctly', () => {
        process.env.NODE_ENV = NodeEnv.production; // Start with production env
        const overrides = {
            nodeEnv: {
                env: NodeEnv.development, // Override to development
            },
        };
        const config = createConfig(overrides);

        expect(config.nodeEnv.env).toBe(NodeEnv.development);
        expect(config.nodeEnv.isDevelopment).toBe(true); // Should reflect the overridden env
        expect(config.nodeEnv.isTesting).toBe(false);
        expect(() => RepoConfigSchema.parse(config)).not.toThrow();
    });

    it('should throw a ZodError for invalid overrides', () => {
        const invalidOverrides = {
            nodeEnv: {
                env: 'invalid_env',
            },
        } as unknown as DeepPartial<RepoConfig>;
        // Expect the function to throw an error due to Zod validation failure
        expect(() => createConfig(invalidOverrides)).toThrow(ZodError);
    });
});
