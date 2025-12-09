import type { RepoConfig } from '@repo/shared-types';
import type { Logger } from 'pino';
import type { InjectionToken } from 'tsyringe';

// Simple string-based injection tokens for consistency
export const AppLogger: InjectionToken<Logger> = 'Logger';
export const AppConfig: InjectionToken<RepoConfig> = 'AppConfig';
