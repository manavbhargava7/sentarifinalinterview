// test/carry_in.test.ts

import { detectCarryIn, CarryInResult } from '../src/steps/carry_in';
import { DiaryEntry } from '../src/types';

// Helper to build the minimal DiaryEntry shape needed for carry-in
function makeDiaryEntry(
  embedding: number[],
  themes: string[]
): DiaryEntry {
  return {
    id: 'dummy-id',
    raw_text: '',
    embedding,
    parsed: {
      theme: themes,
      vibe: [],
      intent: '',
      subtext: '',
      persona_trait: [],
      bucket: [],
    },
    meta_data: {
      word_count: 0,
      top_words: [],
      punctuation_flags: {
        has_exclamation: false,
        has_question: false,
        has_ellipsis: false,
      },
    },
    timestamp: new Date(),
  };
}

describe('Step 07 – Carry-In Detection', () => {
  const THRESHOLD = 0.86;

  it('→ carry_in = false when there is no history', () => {
    const result: CarryInResult = detectCarryIn(
      [1, 2, 3],        // current embedding
      ['theme1'],       // current themes
      [],               // no recent entries
      THRESHOLD
    );

    expect(result.carry_in).toBe(false);
    expect(result.similarity_score).toBe(0);
    expect(result.matching_themes).toEqual([]);
  });

  it('→ carry_in = true when a past entry shares a theme', () => {
    const recent: DiaryEntry[] = [
      makeDiaryEntry([0, 0, 1], ['work-life balance']),
      makeDiaryEntry([0, 1, 0], ['other']),
    ];

    const result: CarryInResult = detectCarryIn(
      [1, 0, 0],                  // current embedding
      ['work-life balance'],      // current themes
      recent,
      THRESHOLD
    );

    expect(result.carry_in).toBe(true);
    expect(result.matching_themes).toEqual(['work-life balance']);
    // embeddings differ, so similarity_score stays below threshold
    expect(result.similarity_score).toBeLessThan(THRESHOLD);
  });

  it('→ carry_in = true when embedding similarity ≥ threshold', () => {
    const vec = [0.5, 0.5];
    const recent: DiaryEntry[] = [
      makeDiaryEntry(vec, []),   // no shared themes
    ];

    const result: CarryInResult = detectCarryIn(
      vec,                       // identical embedding
      [],                        // no current themes
      recent,
      THRESHOLD
    );

    expect(result.carry_in).toBe(true);
    expect(result.similarity_score).toBeCloseTo(1.0, 3);
    expect(result.matching_themes).toEqual([]);
  });

  it('rounds similarity_score to three decimals', () => {
    // Compute a known cosine: [0.3,0.4]⋅[0.4,0.3] → cos ≈ 0.96
    const v1 = [0.3, 0.4];
    const v2 = [0.4, 0.3];
    const recent: DiaryEntry[] = [makeDiaryEntry(v2, [])];

    const result = detectCarryIn(v1, [], recent, THRESHOLD);
    expect(result.similarity_score).toBeCloseTo(0.96, 3);
  });
});
