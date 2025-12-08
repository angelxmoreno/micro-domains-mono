import { createConfig, createContainer } from '@repo/config-builder';
import { CliOutputService } from './services/CliOutputService';

const appConfig = createConfig();
const appContainer = createContainer(appConfig);

appContainer.registerInstance(CliOutputService, new CliOutputService());

export { appContainer, appConfig };
