import type { DeepPartial } from '@ts-types/deep-partial';
import dotenv from 'dotenv';
import { merge } from 'ts-deepmerge';
import { type RepoConfig, RepoConfigSchema } from '../schemas/RepoConfigSchema';
import { NodeEnv } from '../types/NodeEnv';

// Load environment-specific .env file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
const envFiles = [
    `../../.env.${nodeEnv}`, // .env.test, .env.development, etc.
    '../../.env', // Fallback to default .env
];

dotenv.config({
    quiet: true,
    debug: false,
    path: envFiles,
});

export const createConfig = (overrides?: DeepPartial<RepoConfig>): RepoConfig => {
    const env = (process.env.NODE_ENV || NodeEnv.development) as NodeEnv;
    const isDevelopment = env === NodeEnv.development;
    const isTesting = env === NodeEnv.test;

    const repoConfigEnv: RepoConfig = {
        nodeEnv: {
            env,
            isDevelopment,
            isTesting,
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
