import type { TldDtoInsert } from '@repo/shared-types';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { TopLevelDomainEntity } from '../entities/TopLevelDomainEntity';
import { BaseRepositoryService } from './BaseRepositoryService';

@singleton()
export class TopLevelDomainRepository extends BaseRepositoryService<TopLevelDomainEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, TopLevelDomainEntity);
    }

    async batchUpsert(records: TldDtoInsert[]): Promise<void> {
        if (!records.length) {
            return;
        }

        const CHUNK_SIZE = 250;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            await this.repo
                .createQueryBuilder()
                .insert()
                .into(TopLevelDomainEntity)
                .values(chunk)
                .orUpdate(['type', 'whois_server', 'rdap_servers', 'is_active', 'updated_at'], ['tld'])
                .execute();
        }
    }
}
