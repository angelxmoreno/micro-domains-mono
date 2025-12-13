import { Database } from 'bun:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import type { KyselyDatabase } from './types';

const resolveDbPath = (): string => {
    if (process.env.DB_PATH && process.env.DB_PATH.trim().length > 0) {
        return path.resolve(process.env.DB_PATH);
    }
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(currentDir, '../../wordnet.sqlite');
};

const database = new Database(resolveDbPath());
const dialect = new BunSqliteDialect({
    database,
});
export const db = new Kysely<KyselyDatabase>({
    dialect,
});
