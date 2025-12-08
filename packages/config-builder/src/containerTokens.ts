import type { Logger } from 'pino';
import type { InjectionToken } from 'tsyringe';
import type { RepoConfig } from './schemas/RepoConfigSchema';

// Simple string-based injection tokens for consistency
export const AppLogger: InjectionToken<Logger> = 'Logger';
export const AppConfig: InjectionToken<RepoConfig> = 'AppConfig';
