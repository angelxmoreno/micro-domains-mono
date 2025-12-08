import { z } from 'zod';
import { NodeEnv } from '../types/NodeEnv';
import { LoggerConfigSchema } from './LoggerConfigSchema';

export const RepoConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum(NodeEnv),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
    logger: LoggerConfigSchema,
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
