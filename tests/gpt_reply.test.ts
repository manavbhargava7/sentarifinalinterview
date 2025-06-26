import { generateEmpathicReply } from '../src/steps/gpt_reply';
import { ParsedEntry, UserProfile } from '../src/types';

describe('GPT Reply Generator', () => {
  const parsed: ParsedEntry = {
    theme: ['work-life balance'],
    vibe: ['anxious'],
    intent: 'Find rest',
    subtext: 'Fear of falling behind',
    persona_trait: ['conscientious'],
    bucket: ['Thought']
  };

  const baseProfile: UserProfile = {
    top_themes: [],
    theme_count: {},
    dominant_vibe: '',
    vibe_count: {},
    bucket_count: {},
    trait_pool: [],
    last_theme: ''
  };

  it('returns first-entry response for anxious', () => {
    const reply = generateEmpathicReply(parsed, baseProfile, false, false);
    expect(reply).toMatch(/drained|rest/i);
    expect(reply.length).toBeLessThanOrEqual(55);
  });

  it('returns carry-in response with emoji for 100th entry', () => {
    const profileWithData: UserProfile = {
      ...baseProfile,
      vibe_count: { driven: 12, anxious: 5 }
    };

    const reply = generateEmpathicReply(parsed, profileWithData, true, false);
    expect(reply).toMatch(/🧩|focused/);
  });

  it('returns contrast warning when emotion flip occurs', () => {
    const profileWithData: UserProfile = {
      ...baseProfile,
      vibe_count: { driven: 10, curious: 2 }
    };

    const reply = generateEmpathicReply(parsed, profileWithData, false, true);
    expect(reply).toMatch(/🔄|shift|Big shift/i);
  });
});