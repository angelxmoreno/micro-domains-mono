import { z } from 'zod';
import { LogLevel } from '../types/LogLevel';

export const LoggerConfigSchema = z.object({
    usePretty: z.boolean().optional().default(true),
    level: z.enum(LogLevel).optional().default(LogLevel.info),
});

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
