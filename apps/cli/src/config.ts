import { CliOutputService } from '@repo/cli-helper';
import { createConfig, createContainer } from '@repo/config-builder';

const appConfig = createConfig();
const appContainer = createContainer(appConfig);

appContainer.registerInstance(CliOutputService, new CliOutputService());

export { appContainer, appConfig };
