import { CliLogger, CliOutputService } from '@repo/cli-helper';
import { AppCache, createConfig, createContainer } from '@repo/config-builder';
import { TldCrawler } from '@repo/tld-crawler';

const appConfig = createConfig();
const appContainer = createContainer(appConfig);

appContainer.registerInstance(CliOutputService, new CliOutputService());
appContainer.register(TldCrawler, {
    useFactory: (c) =>
        new TldCrawler({
            logger: c.resolve(CliLogger),
            cache: c.resolve(AppCache),
        }),
});

export { appContainer, appConfig };
