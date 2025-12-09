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

    @Column('varchar', { length: 50, nullable: true })
    partOfSpeech?: string; // Using partOfSpeech for consistency with TS naming

    @Column('varchar', { length: 100, nullable: true })
    origin?: string;

    @Column('varchar', { length: 100, nullable: true })
    location?: string;

    @Column('text', { nullable: true })
    definition?: string;
}
