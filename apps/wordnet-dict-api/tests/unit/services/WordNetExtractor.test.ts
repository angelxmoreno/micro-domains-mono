import { describe, expect, it } from 'bun:test';
import { WordNetExtractor } from '../../../src/services/WordNetExtractor';
import { testWordNet } from '../../sample-data-files/test-wordnet';

describe('WordNetExtractor', () => {
    const extractor = new WordNetExtractor(testWordNet);

    it('works', () => {
        expect(extractor).toBeInstanceOf(WordNetExtractor);
    });
});
