import { createConfig, createContainer } from '@repo/config-builder';

export const appConfig = createConfig();
export const appContainer = createContainer(appConfig);
