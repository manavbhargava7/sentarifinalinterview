import { ProfileFetcher, ProfileUpdater, ContrastChecker } from './index';
import { ParsedEntry } from '../types';

/**
 * Integration Example: How to use Profile Team functions in the Sentari Pipeline
 * This demonstrates replacing the existing pipeline steps 4, 8, and 9 with dedicated profile functions
 */

export class ProfileIntegrationExample {
  private profileFetcher: ProfileFetcher;
  private profileUpdater: ProfileUpdater;
  private contrastChecker: ContrastChecker;
  
  constructor(profilesDir: string = './data/profiles') {
    this.profileFetcher = new ProfileFetcher(profilesDir);
    this.profileUpdater = new ProfileUpdater();
    this.contrastChecker = new ContrastChecker();
  }

  /**
   * Example of how to replace the pipeline's profile-related steps
   * Call this instead of step04_fetchProfile, step08_contrastCheck, step09_profileUpdate
   */
  async processProfileSteps(userId: string, parsed: ParsedEntry) {
    console.log('\n🔄 PROCESSING PROFILE STEPS WITH DEDICATED FUNCTIONS');
    
    // Step 04: FETCH_PROFILE (replaces step04_fetchProfile)
    console.log('\n--- STEP 04: FETCH_PROFILE ---');
    const profile = await this.profileFetcher.fetchProfile(userId);
    
    // Step 08: CONTRAST_CHECK (replaces step08_contrastCheck) 
    console.log('\n--- STEP 08: CONTRAST_CHECK ---');
    const contrastResult = this.contrastChecker.checkContrast(parsed.vibe, profile);
    
    // Step 09: PROFILE_UPDATE (replaces step09_profileUpdate)
    console.log('\n--- STEP 09: PROFILE_UPDATE ---');
    const updatedProfile = this.profileUpdater.updateProfile(profile, parsed);
    
    // Save the updated profile
    await this.profileFetcher.saveProfile(userId, updatedProfile);
    
    return {
      profile: updatedProfile,
      contrast: contrastResult
    };
  }

  /**
   * Example showing the difference between first entry and 100th entry
   */
  async demonstrateFirstVsHundredth() {
    console.log('\n📊 DEMONSTRATING FIRST VS 100TH ENTRY BEHAVIOR');
    
    // First entry example
    const firstEntryParsed: ParsedEntry = {
      theme: ['work-life balance'],
      vibe: ['anxious', 'exhausted'],
      intent: "Find rest without guilt or fear of missing out",
      subtext: "Fears being seen as less committed",
      persona_trait: ['conscientious', 'vigilant'],
      bucket: ['Thought']
    };
    
    console.log('\n🆕 FIRST ENTRY PROCESSING:');
    const firstResult = await this.processProfileSteps('demo_user_first', firstEntryParsed);
    
    console.log('First entry results:');
    console.log(`- Dominant vibe: ${firstResult.profile.dominant_vibe}`);
    console.log(`- Emotion flip: ${firstResult.contrast.emotion_flip}`);
    console.log(`- Total entries: ${Object.values(firstResult.profile.bucket_count).reduce((a, b) => a + b, 0)}`);
    
    // Simulate 100th entry by loading pre-existing profile
    const hundredthEntryParsed: ParsedEntry = {
      theme: ['work-life balance', 'personal growth'],
      vibe: ['exhausted', 'overwhelmed'],
      intent: "Need to find better balance and recharge",
      subtext: "Recognizing the need for sustainable practices",
      persona_trait: ['reflective', 'conscientious'],
      bucket: ['Value']
    };
    
    // Create mock established user profile
    const establishedProfile = {
      top_themes: ['intern management', 'startup culture', 'productivity', 'work-life balance'],
      theme_count: {
        'intern management': 35,
        'productivity': 22,
        'startup culture': 18,
        'work-life balance': 12
      },
      dominant_vibe: 'driven',
      vibe_count: {
        'driven': 41,
        'curious': 19,
        'overwhelmed': 14,
        'excited': 9
      },
      bucket_count: {
        'Goal': 48,
        'Thought': 27,
        'Hobby': 15,
        'Value': 9
      },
      trait_pool: ['organiser', 'builder', 'mentor'],
      last_theme: 'productivity'
    };
    
    await this.profileFetcher.saveProfile('demo_user_hundred', establishedProfile);
    
    console.log('\n💯 100TH ENTRY PROCESSING:');
    const hundredthResult = await this.processProfileSteps('demo_user_hundred', hundredthEntryParsed);
    
    console.log('Hundredth entry results:');
    console.log(`- Dominant vibe: ${hundredthResult.profile.dominant_vibe}`);
    console.log(`- Emotion flip: ${hundredthResult.contrast.emotion_flip}`);
    console.log(`- Contrast type: ${hundredthResult.contrast.contrast_type}`);
    console.log(`- Total entries: ${Object.values(hundredthResult.profile.bucket_count).reduce((a, b) => a + b, 0)}`);
    
    // Show meaningful differences
    console.log('\n📈 KEY DIFFERENCES:');
    console.log(`- First entry emotion flip: ${firstResult.contrast.emotion_flip} (new user, no comparison)`);
    console.log(`- 100th entry emotion flip: ${hundredthResult.contrast.emotion_flip} (established pattern detected)`);
    console.log(`- First entry profile richness: ${firstResult.profile.trait_pool.length} traits`);
    console.log(`- 100th entry profile richness: ${hundredthResult.profile.trait_pool.length} traits`);
  }
}

/**
 * Quick usage example
 */
export async function runProfileIntegrationDemo(): Promise<void> {
  const integration = new ProfileIntegrationExample('./demo_profiles');
  await integration.demonstrateFirstVsHundredth();
  
  console.log('\n✅ PROFILE INTEGRATION DEMO COMPLETED');
  console.log('\nTo integrate into existing pipeline:');
  console.log('1. Replace step04_fetchProfile with ProfileFetcher.fetchProfile()');
  console.log('2. Replace step08_contrastCheck with ContrastChecker.checkContrast()');
  console.log('3. Replace step09_profileUpdate with ProfileUpdater.updateProfile()');
  console.log('4. Add ProfileFetcher.saveProfile() after updates');
} 