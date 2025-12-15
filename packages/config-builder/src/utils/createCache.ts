import Keyv, { type Options, type Store } from '@keyvhq/core';
import KeyvRedis from '@keyvhq/redis';
import KeyvSqlite from '@keyvhq/sqlite';
import type { RepoConfig } from '@repo/shared-types';

type CacheType = 'sqlite' | 'redis' | undefined;

const cacheTypeFromUrl = (url: string) => new URL(url).protocol as CacheType;

export const createCache = <T = unknown>(config: RepoConfig['cache']): Keyv<T> => {
    const cacheType = cacheTypeFromUrl(config.url);

    let store: Store<T> | undefined;

    switch (cacheType) {
        case 'redis':
            store = new KeyvRedis(config.url);
            break;

        case 'sqlite':
            store = new KeyvSqlite(config.url);
            break;
    }

    const options: Options<T> = {
        namespace: config.namespace,
        ttl: config.ttl,
    };
    if (store) {
        options.store = store;
    }
    return new Keyv(options);
};
