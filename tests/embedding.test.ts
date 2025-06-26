import { embeddingStep } from '../src/steps/embedding';

describe('Embedding Step', () => {
  it('returns 384-dim vector for mock mode', async () => {
    const result = await embeddingStep('This is a test diary entry.', true);
    expect(result.embedding.length).toBe(384);
    expect(result.mode).toContain('[MOCK');
  });

  it('returns zeros for empty input', async () => {
    const result = await embeddingStep('', true);
    const sum = result.embedding.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0);
  });

  it('has stable output for same input', async () => {
    const res1 = await embeddingStep('Consistency test.', true);
    const res2 = await embeddingStep('Consistency test.', true);
    expect(res1.embedding).toEqual(res2.embedding);
  });
});