import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
    url: z.url(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
