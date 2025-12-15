import { createDataSourceOptions, DataSource } from '@repo/database';
import type { RepoConfig } from '@repo/shared-types';
import { container, type DependencyContainer, type InjectionToken, instanceCachingFactory } from 'tsyringe';
import { AppCache, AppConfig, AppLogger } from '../containerTokens';
import { createBaseLogger } from './createBaseLogger';
import { createCache } from './createCache';

export const createContainer = (config: RepoConfig): DependencyContainer => {
    const appContainer = container.createChildContainer();

    // Utility function to reduce DI registration boilerplate
    const registerFactory = <T>(token: InjectionToken<T>, factory: (container: DependencyContainer) => T) => {
        appContainer.register<T>(token, {
            useFactory: instanceCachingFactory<T>(factory),
        });
    };

    // Register logger with error handling
    registerFactory(AppLogger, () => createBaseLogger(config));

    // Register AppConfig for dependency injection
    appContainer.registerInstance(AppConfig, config);

    // create typeorm datasource
    registerFactory(DataSource, () => new DataSource(createDataSourceOptions(config.database)));

    // Register KeyvHQ cache
    registerFactory(AppCache, () => createCache(config.cache));

    return appContainer;
};
