import { z } from 'zod';
import { NodeEnv } from '../types/NodeEnv';
import { DatabaseConfigSchema } from './DatabaseConfigSchema';
import { LoggerConfigSchema } from './LoggerConfigSchema';

export const RepoConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum(NodeEnv),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
    logger: LoggerConfigSchema,
    database: DatabaseConfigSchema,
    cache: z.object({
        url: z.string(),
        namespace: z.string().optional(),
        ttl: z.number().optional(),
    }),
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
