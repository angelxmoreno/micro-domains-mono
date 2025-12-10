import { Database } from 'bun:sqlite';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from 'kysely-bun-sqlite';
import type { KyselyDatabase } from './types';

const database = new Database('wordnet.sqlite');
const dialect = new BunSqliteDialect({
    database,
});
export const db = new Kysely<KyselyDatabase>({
    dialect,
});
