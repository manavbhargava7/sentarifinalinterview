import { SentariPipeline } from './pipeline_master';
import { MockDataGenerator } from './mockData';

async function runSimulation(mode: 'first' | 'hundred') {
  console.log(`\n=== SENTARI SIMULATION: ${mode.toUpperCase()} ENTRY ===\n`);

  const pipeline = new SentariPipeline();
  const testTranscript = "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.";

  if (mode === 'hundred') {
    // Load 99 mock entries to simulate established user
    console.log("Loading 99 mock entries to simulate 100th entry scenario...\n");
    const mockEntries = MockDataGenerator.generateMockEntries(99);
    const mockProfile = MockDataGenerator.generateMockProfile(mockEntries);

    pipeline.loadMockEntries(mockEntries);
    pipeline.setProfile(mockProfile);

    console.log(`Loaded ${mockEntries.length} previous entries.`);
    console.log(`Current profile - Dominant vibe: ${mockProfile.dominant_vibe}, Top themes: ${mockProfile.top_themes.slice(0, 3).join(', ')}\n`);
  }

  // Process the new entry
  console.log(`Processing new diary entry:\n"${testTranscript}"\n`);
  console.log(" 13-STEP PIPELINE EXECUTION \n");

  const result = await pipeline.processDiaryEntry(testTranscript);

  console.log("\n PIPELINE RESULTS \n");
  console.log(`Entry ID: ${result.entryId}`);
  console.log(`AI Response: "${result.response_text}" (${result.response_text.length} chars)`);
  console.log(`Carry-in Flag: ${result.carry_in}`);
  console.log(`Emotion Flip: ${result.emotion_flip}`);
  console.log(`Total Entries: ${pipeline.getEntryCount()}`);

  console.log("\nUpdated Profile Summary:");
  console.log(`- Dominant Vibe: ${result.updated_profile.dominant_vibe}`);
  console.log(`- Top Themes: ${result.updated_profile.top_themes.slice(0, 3).join(', ')}`);
  console.log(`- Trait Pool: ${result.updated_profile.trait_pool.slice(0, 3).join(', ')}`);

  console.log(`\n=== ${mode.toUpperCase()} ENTRY SIMULATION COMPLETE ===\n`);
}

// Command line interface
const mode = process.argv[2] as 'first' | 'hundred';

if (!mode || !['first', 'hundred'].includes(mode)) {
  console.error('Usage: node simulate.js [first|hundred]');
  process.exit(1);
}

runSimulation(mode).catch(console.error); 