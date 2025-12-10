import { type AppCommand, CliLogger, createTypedCommand, type TypedActionFunction } from '@repo/cli-helper';
import wordnetDb from 'wordnet-db';
import { db } from '../db';
import { WordNetExtractor } from '../services/WordNetExtractor';
import type { WordNetPOS } from '../types/WordNet';

const DbImportAction: TypedActionFunction<[]> = async ({ container }): Promise<void> => {
    const logger = container.resolve(CliLogger);
    logger.info('WordNet database import started...');

    const extractor = new WordNetExtractor(wordnetDb);
    const posList: WordNetPOS[] = ['n', 'v', 'a', 'r'];

    try {
        for (const pos of posList) {
            logger.info(`Importing ${pos.toUpperCase()} data...`);
            let synsetCount = 0;

            for await (const synset of extractor.allSynsets(pos)) {
                await db.transaction().execute(async (trx) => {
                    // Insert into words table (or get existing word_id)
                    let wordId: number;
                    const existingWord = await trx
                        .selectFrom('words')
                        .select('id')
                        .where('lemma', '=', synset.word)
                        .where('pos', '=', synset.partOfSpeech)
                        .executeTakeFirst();

                    if (existingWord) {
                        wordId = existingWord.id;
                    } else {
                        const insertedWord = await trx
                            .insertInto('words')
                            .values({
                                lemma: synset.word,
                                pos: synset.partOfSpeech,
                                frequency: synset.frequency ?? null,
                            })
                            .returning('id')
                            .executeTakeFirstOrThrow();
                        wordId = insertedWord.id;
                    }

                    // Insert into synsets table (or get existing synset_id)
                    let synsetId: number;
                    const existingSynset = await trx
                        .selectFrom('synsets')
                        .select('id')
                        .where('offset', '=', synset.offset)
                        .where('pos', '=', synset.partOfSpeech)
                        .executeTakeFirst();

                    if (existingSynset) {
                        synsetId = existingSynset.id;
                    } else {
                        const insertedSynset = await trx
                            .insertInto('synsets')
                            .values({
                                offset: synset.offset,
                                pos: synset.partOfSpeech,
                                definition: synset.definition,
                                frequency: synset.frequency ?? null,
                                sense_key: synset.senseKey ?? null,
                            })
                            .returning('id')
                            .executeTakeFirstOrThrow();
                        synsetId = insertedSynset.id;
                    }

                    // Insert into word_synsets join table
                    await trx
                        .insertInto('word_synsets')
                        .values({ word_id: wordId, synset_id: synsetId })
                        .onConflict((oc) => oc.doNothing())
                        .execute();

                    // Insert examples
                    if (synset.examples && synset.examples.length > 0) {
                        const exampleValues = synset.examples.map((exampleText) => ({
                            synset_id: synsetId,
                            text: exampleText,
                        }));
                        await trx.insertInto('examples').values(exampleValues).execute();
                    }

                    // Insert relations
                    if (synset.relations) {
                        const relationValues = Object.entries(synset.relations).flatMap(
                            ([relationType, targetOffsets]) =>
                                targetOffsets.map((targetOffset) => ({
                                    synset_id: synsetId,
                                    relation_type: relationType,
                                    target_offset: targetOffset,
                                }))
                        );
                        if (relationValues.length > 0) {
                            await trx.insertInto('relations').values(relationValues).execute();
                        }
                    }
                });
                synsetCount++;
                if (synsetCount % 1000 === 0) {
                    logger.debug(`Processed ${synsetCount} ${pos.toUpperCase()} synsets...`);
                }
            }
            logger.info(`Finished importing ${synsetCount} ${pos.toUpperCase()} synsets.`);
        }
        logger.info('WordNet database import complete!');
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error during WordNet database import: ${error.message}\n${error.stack ?? ''}`);
        } else {
            logger.error(`An unknown error occurred during WordNet database import: ${JSON.stringify(error)}`);
        }
        throw error;
    } finally {
        await db.destroy();
    }
};

export const DbImportCommand: AppCommand = createTypedCommand(
    {
        command: 'db-import',
        description: 'Imports WordNet data into the SQLite database.',
    },
    DbImportAction
);
