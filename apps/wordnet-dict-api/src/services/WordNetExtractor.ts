import type { Synset, WordNetPOS, WordRelationType } from '../types/WordNet';
import { BaseWordNetService, indexFileMap, relMap } from './BaseWordNetService'; // runtime import

export class WordNetExtractor extends BaseWordNetService {
    /** Yield every synset entry (one per lemma in that synset) — ready to insert */
    async *allSynsets(pos: WordNetPOS): AsyncGenerator<Synset> {
        for await (const line of this.streamLines(indexFileMap[pos])) {
            if (!line.trim()) continue;
            // WordNet data line: offset lex_filenum pos w_cnt words... p_cnt pointers... | gloss
            const [left, right] = line.split('|');
            const synsetInfo = left?.trim();
            if (synsetInfo === undefined) {
                continue;
            }
            const gloss = (right ?? '').trim();

            const parts = synsetInfo.split(/\s+/);
            const offset = parts[0];
            if (offset === undefined) {
                continue;
            }
            const wCntHex = parts[3] ?? '0'; // word count is hex
            const wCnt = parseInt(wCntHex, 16) || 0;

            const wordsAndLexIds = parts.slice(4, 4 + wCnt * 2);
            const words: string[] = [];
            for (let i = 0; i < wordsAndLexIds.length; i += 2) {
                const word = wordsAndLexIds[i];
                if (word !== undefined) {
                    words.push(word);
                }
            }

            // Parse pointers for relations: located after words and before the '|'
            // pointer region starts after words and includes p_cnt then sequences of (symbol, offset, pos,...)
            const pCntIndex = 4 + wCnt * 2;
            const pCnt = parseInt(parts[pCntIndex] ?? '0', 10) || 0;
            const pointerEntriesStart = pCntIndex + 1;
            const pointers: { sym: string; target: string }[] = [];
            for (let i = 0; i < pCnt; i++) {
                const base = pointerEntriesStart + i * 4; // each pointer: symbol targetOffset pos sourceTarget
                const sym = parts[base];
                const target = parts[base + 1];
                if (sym && target) pointers.push({ sym, target });
            }

            const relations: Partial<Record<WordRelationType, string[]>> = {};
            for (const p of pointers) {
                const rt = relMap[p.sym];
                if (rt) {
                    if (relations[rt]) {
                        relations[rt].push(p.target);
                    } else {
                        relations[rt] = [p.target];
                    }
                }
            }

            const examplesMatches = gloss.match(/"([^"]+)"/g) ?? [];
            const examples = examplesMatches.map((ex) => ex.replace(/"/g, '').trim());
            const definition = gloss.replace(/"[^"]+"/g, '').trim();

            for (const w of words) {
                // words sometimes contain lexical ids (like 'abandon%1'), strip trailing metadata if present
                const lemma = w.split('%')[0];
                if (lemma === undefined) {
                    continue;
                }
                yield {
                    offset,
                    word: lemma,
                    partOfSpeech: pos,
                    definition,
                    examples,
                    relations: Object.keys(relations).length
                        ? (relations as Record<WordRelationType, string[]>)
                        : undefined,
                    frequency: undefined, // frequency can be pulled from index files if you want
                    senseKey: `${lemma}%${pos}:${offset}::`,
                };
            }
        }
    }
}
