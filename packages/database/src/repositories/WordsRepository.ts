import type { WordDtoInsert } from '@repo/shared-types';
import { inject, singleton } from 'tsyringe';
import { DataSource, In } from 'typeorm';
import { WordEntity } from '../entities/WordEntity';
import { BaseRepositoryService } from './BaseRepositoryService';

@singleton()
export class WordsRepository extends BaseRepositoryService<WordEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, WordEntity);
    }

    async bulkInsertIfNotExists(words: WordDtoInsert[]) {
        const CHUNK_SIZE = 5000;

        for (let i = 0; i < words.length; i += CHUNK_SIZE) {
            const batch = words.slice(i, i + CHUNK_SIZE);

            // extract names for this batch
            const names = [...new Set(batch.map((w) => w.name))];

            // query DB only for this batch (small IN list)
            const existing = await this.findMany({
                name: In(names),
            });

            const existingNames = new Set(existing.map((w) => w.name));

            // prepare inserts
            const toInsert = batch.filter((w) => !existingNames.has(w.name));

            if (toInsert.length > 0) {
                await this.repo
                    .createQueryBuilder()
                    .insert()
                    .values(toInsert)
                    .orIgnore() // ignore duplicates
                    .execute();
            }
        }
    }
}
