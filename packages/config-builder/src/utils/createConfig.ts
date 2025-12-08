import { join } from 'node:path';
import * as process from 'node:process';
import type { DeepPartial } from '@ts-types/deep-partial';
import dotenv from 'dotenv';
import { merge } from 'ts-deepmerge';
import { type RepoConfig, RepoConfigSchema } from '../schemas/RepoConfigSchema';
import { inferLogLevel } from '../types/LogLevel';
import { NodeEnv } from '../types/NodeEnv';
import { envParser } from './envParser';

export const createConfig = (overrides?: DeepPartial<RepoConfig>): RepoConfig => {
    // Determine the environment once and reuse it
    const env = (process.env.NODE_ENV || NodeEnv.development) as NodeEnv;

    // Determine base paths reliably from this file's location
    const currentFileDir = import.meta.dir; // .../packages/config-builder/src/utils
    const packageRoot = join(currentFileDir, '..', '..'); // .../packages/config-builder
    const monorepoRoot = join(packageRoot, '..', '..'); // .../monorepo-root

    // Construct the array of .env file paths in desired priority order.
    const envFiles = [
        // 1. @repo/config-builder package root (for package-specific defaults)
        join(packageRoot, `.env.${env}`),
        join(packageRoot, '.env'),

        // 2. Current execution directory (the app's root)
        join(process.cwd(), `.env.${env}`),
        join(process.cwd(), '.env'),

        // 3. Monorepo Root (global fallback)
        join(monorepoRoot, `.env.${env}`),
        join(monorepoRoot, '.env'),
    ];
    dotenv.config({
        path: envFiles,
        quiet: true,
        override: false, // ensures first-found variable wins
    });

    const isDevelopment = env === NodeEnv.development;
    const isTesting = env === NodeEnv.test;

    const repoConfigEnv: RepoConfig = {
        nodeEnv: {
            env,
            isDevelopment,
            isTesting,
        },
        logger: {
            level: inferLogLevel(process.env.LOG_LEVEL, env),
            usePretty:
                process.env.PRETTY_LOGGING === undefined
                    ? isDevelopment || isTesting
                    : envParser.parseBoolean(process.env.PRETTY_LOGGING),
        },
    };

    const config = merge(repoConfigEnv, overrides ?? {});

    // Recalculate isDevelopment and isTesting based on the potentially overridden 'env'
    if (config.nodeEnv) {
        config.nodeEnv.isDevelopment = config.nodeEnv.env === NodeEnv.development;
        config.nodeEnv.isTesting = config.nodeEnv.env === NodeEnv.test;
    }

    return RepoConfigSchema.parse(config);
};
