import { TldType } from '@repo/shared-types/src/types/TldType';
import { Column, Entity, Index } from 'typeorm';
import { AppEntity } from './AppEntity';

@Entity()
export class TopLevelDomainEntity extends AppEntity {
    @Column({ type: 'varchar', length: 63, nullable: false })
    @Index({ unique: true })
    tld: string;

    @Column({
        type: 'enum',
        enum: TldType,
        nullable: true,
        default: null,
    })
    type?: TldType | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    whoisServer?: string | null;

    @Column({ type: 'simple-array', nullable: true, default: null })
    rdapServers?: string[] | null;

    @Column({ type: 'boolean', default: null, nullable: true })
    @Index()
    isActive?: boolean | null;
}
