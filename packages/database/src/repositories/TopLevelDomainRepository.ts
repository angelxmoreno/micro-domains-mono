import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';
import { TopLevelDomainEntity } from '../entities/TopLevelDomainEntity';
import { BaseRepositoryService } from './BaseRepositoryService';

@singleton()
export class TopLevelDomainRepository extends BaseRepositoryService<TopLevelDomainEntity> {
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, TopLevelDomainEntity);
    }
}
