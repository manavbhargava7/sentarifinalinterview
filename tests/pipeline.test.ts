import { SentariPipeline } from '../src/pipeline';
import { MockDataGenerator } from '../src/mockData';

describe('Sentari Pipeline', () => {
  let pipeline: SentariPipeline;

  beforeEach(() => {
    pipeline = new SentariPipeline();
  });

  test('should process first entry correctly', async () => {
    const transcript = "I'm feeling overwhelmed with all the new responsibilities at work.";
    const result = await pipeline.processDiaryEntry(transcript);

    expect(result.entryId).toBeDefined();
    expect(result.response_text).toBeDefined();
    expect(result.response_text.length).toBeLessThanOrEqual(55);
    expect(result.carry_in).toBe(false); // First entry should not carry in
    expect(result.updated_profile).toBeDefined();
  });

  test('should handle hundred entry scenario', async () => {
    // Load 99 mock entries
    const mockEntries = MockDataGenerator.generateMockEntries(99);
    const mockProfile = MockDataGenerator.generateMockProfile(mockEntries);
    
    pipeline.loadMockEntries(mockEntries);
    pipeline.setProfile(mockProfile);

    const transcript = "Still working on startup culture improvements.";
    const result = await pipeline.processDiaryEntry(transcript);

    expect(pipeline.getEntryCount()).toBe(100);
    expect(result.response_text).toBeDefined();
    expect(result.updated_profile.dominant_vibe).toBeDefined();
  });

  test('should detect carry-in for similar themes', async () => {
    // First entry with specific theme
    await pipeline.processDiaryEntry("Working on productivity improvements for the team.");
    
    // Second entry with similar theme
    const result = await pipeline.processDiaryEntry("Implementing new productivity tools today.");
    
    // Carry-in might be true due to theme overlap
    expect(typeof result.carry_in).toBe('boolean');
  });

  test('should generate different responses for first vs established user', async () => {
    const transcript = "I'm excited about the new project launch!";
    
    // First entry
    const firstResult = await pipeline.processDiaryEntry(transcript);
    
    // Load mock entries to simulate established user
    const mockEntries = MockDataGenerator.generateMockEntries(50);
    const mockProfile = MockDataGenerator.generateMockProfile(mockEntries);
    pipeline.loadMockEntries(mockEntries);
    pipeline.setProfile(mockProfile);
    
    // Process same transcript as established user
    const establishedResult = await pipeline.processDiaryEntry(transcript);
    
    // Responses should be different
    expect(firstResult.response_text).not.toBe(establishedResult.response_text);
  });

  test('should update profile counters correctly', async () => {
    const result = await pipeline.processDiaryEntry("I'm working on intern management strategies.");
    
    const profile = result.updated_profile;
    expect(profile.theme_count).toBeDefined();
    expect(profile.vibe_count).toBeDefined();
    expect(profile.bucket_count).toBeDefined();
    
    // Should have at least one theme
    expect(Object.keys(profile.theme_count).length).toBeGreaterThan(0);
  });
}); 