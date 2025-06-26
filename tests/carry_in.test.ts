import { detectCarryIn } from '../src/steps/carry_in';
import { DiaryEntry } from '../src/types';

describe('CARRY_IN detection', () => {
  const mockCurrentEmbedding = Array(384).fill(0.01); // mock current vector
  const mockPriorEmbedding = Array(384).fill(0.01); // identical → cosine = 1
  const mockThemes = ['productivity', 'stress'];

  const mockRecentEntries: DiaryEntry[] = [
    {
      id: '1',
      raw_text: 'Previous entry on productivity',
      embedding: mockPriorEmbedding,
      parsed: {
        theme: ['productivity'],
        vibe: [],
        intent: '',
        subtext: '',
        persona_trait: [],
        bucket: [],
      },
      meta_data: {
        word_count: 5,
        top_words: ['previous', 'entry', 'productivity'],
        punctuation_flags: {
          has_exclamation: false,
          has_question: false,
          has_ellipsis: false,
        },
      },
      timestamp: new Date(),
    }
  ];

  test('should return carry_in=true if theme matches', () => {
    const result = detectCarryIn(mockCurrentEmbedding, mockThemes, mockRecentEntries);
    expect(result.carry_in).toBe(true);
    expect(result.matching_themes).toContain('productivity');
  });

  test('should return carry_in=true if cosine similarity > threshold', () => {
    const result = detectCarryIn(mockCurrentEmbedding, ['unrelated'], mockRecentEntries);
    expect(result.carry_in).toBe(true);
    expect(result.similarity_score).toBeGreaterThanOrEqual(0.86);
  });

  test('should return carry_in=false if no match and low similarity', () => {
    const differentVec = Array(384).fill(-0.01);
    const lowSimEntries: DiaryEntry[] = [
      {
        id: '2',
        raw_text: 'Unrelated entry',
        embedding: differentVec,
        parsed: {
          theme: ['wellness'],
          vibe: [],
          intent: '',
          subtext: '',
          persona_trait: [],
          bucket: [],
        },
        meta_data: {
          word_count: 2,
          top_words: ['unrelated', 'entry'],
          punctuation_flags: {
            has_exclamation: false,
            has_question: false,
            has_ellipsis: false,
          },
        },
        timestamp: new Date(),
      }
    ];
    const result = detectCarryIn(mockCurrentEmbedding, ['startup'], lowSimEntries);
    expect(result.carry_in).toBe(false);
  });

  test('should return carry_in=false if no recent entries', () => {
    const result = detectCarryIn(mockCurrentEmbedding, ['startup'], []);
    expect(result.carry_in).toBe(false);
  });
});