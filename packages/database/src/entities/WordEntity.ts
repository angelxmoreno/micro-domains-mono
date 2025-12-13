import { Column, Entity } from 'typeorm';
import { AppEntity } from './AppEntity';

@Entity()
export class WordEntity extends AppEntity {
    @Column('varchar', { length: 255, unique: true })
    name: string;

    @Column('boolean', { nullable: true, default: null })
    valid?: boolean;

    @Column('varchar', { length: 255, nullable: false })
    source: string;
}
