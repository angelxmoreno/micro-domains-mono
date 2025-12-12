import type { Kysely } from 'kysely';
import type { KyselyDatabase } from '../types';

export async function up(db: Kysely<KyselyDatabase>): Promise<void> {
    // Words table
    await db.schema
        .createTable('words')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('lemma', 'text', (col) => col.notNull())
        .addColumn('pos', 'text', (col) => col.notNull())
        .addUniqueConstraint('words_lemma_pos_unique', ['lemma', 'pos'])
        .execute();

    // Synsets table
    await db.schema
        .createTable('synsets')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('offset', 'text', (col) => col.notNull())
        .addColumn('pos', 'text', (col) => col.notNull())
        .addColumn('definition', 'text', (col) => col.notNull())
        .addColumn('sense_key', 'text')
        .addUniqueConstraint('synsets_offset_pos_unique', ['offset', 'pos'])
        .execute();

    // WordSynsets join table
    await db.schema
        .createTable('word_synsets')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('word_id', 'integer', (col) => col.notNull().references('words.id').onDelete('cascade'))
        .addColumn('synset_id', 'integer', (col) => col.notNull().references('synsets.id').onDelete('cascade'))
        .addUniqueConstraint('word_synsets_unique', ['word_id', 'synset_id'])
        .execute();

    // Examples table
    await db.schema
        .createTable('examples')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('synset_id', 'integer', (col) => col.notNull().references('synsets.id').onDelete('cascade'))
        .addColumn('text', 'text', (col) => col.notNull())
        .execute();

    // Relations table
    await db.schema
        .createTable('relations')
        .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
        .addColumn('synset_id', 'integer', (col) => col.notNull().references('synsets.id').onDelete('cascade'))
        .addColumn('relation_type', 'text', (col) => col.notNull())
        .addColumn('target_offset', 'text', (col) => col.notNull())
        .execute();

    // Indexes
    await db.schema.createIndex('words_lemma_pos_idx').on('words').columns(['lemma', 'pos']).execute();
    await db.schema.createIndex('synsets_offset_pos_idx').on('synsets').columns(['offset', 'pos']).execute();
    await db.schema.createIndex('word_synsets_word_id_idx').on('word_synsets').column('word_id').execute();
    await db.schema.createIndex('word_synsets_synset_id_idx').on('word_synsets').column('synset_id').execute();
    await db.schema.createIndex('examples_synset_id_idx').on('examples').column('synset_id').execute();
    await db.schema.createIndex('relations_synset_id_idx').on('relations').column('synset_id').execute();
}

export async function down(db: Kysely<KyselyDatabase>): Promise<void> {
    await db.schema.dropTable('relations').execute();
    await db.schema.dropTable('examples').execute();
    await db.schema.dropTable('word_synsets').execute();
    await db.schema.dropTable('synsets').execute();
    await db.schema.dropTable('words').execute();
}
