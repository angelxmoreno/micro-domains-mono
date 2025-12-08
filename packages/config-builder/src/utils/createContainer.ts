import { container, type DependencyContainer, type InjectionToken, instanceCachingFactory } from 'tsyringe';
import { AppConfig, AppLogger } from '../containerTokens';
import type { RepoConfig } from '../schemas/RepoConfigSchema';
import { createBaseLogger } from './createBaseLogger';

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

    return appContainer;
};
