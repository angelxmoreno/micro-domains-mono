import { z } from 'zod';
import { nodeEnvs } from '../types/NodeEnv';

export const RepoConfigSchema = z.object({
    nodeEnv: z.object({
        env: z.enum(nodeEnvs),
        isDevelopment: z.boolean(),
        isTesting: z.boolean(),
    }),
});

export type RepoConfig = z.infer<typeof RepoConfigSchema>;
