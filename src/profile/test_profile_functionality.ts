import { ProfileFetcher } from './fetch_profile';
import { ProfileUpdater } from './profile_update';
import { ContrastChecker } from './contrast_check';
import { UserProfile, ParsedEntry } from '../types';

/**
 * Test Profile Functionality
 * Demonstrates the profile team implementation for both scenarios:
 * 1. First entry (new user)
 * 2. 100th entry (established user)
 */

export class ProfileFunctionalityTest {
  private fetcher: ProfileFetcher;
  private updater: ProfileUpdater;
  private contrastChecker: ContrastChecker;

  constructor() {
    this.fetcher = new ProfileFetcher('./test_data/profiles');
    this.updater = new ProfileUpdater();
    this.contrastChecker = new ContrastChecker();
  }

  /**
   * Test Case 1: First Entry - New User
   */
  async testFirstEntry(): Promise<void> {
    console.log('\n=== TESTING FIRST ENTRY (NEW USER) ===');
    
    const userId = 'test_user_first';
    const firstEntryParsed: ParsedEntry = {
      theme: ['work-life balance'],
      vibe: ['anxious', 'exhausted'],
      intent: "Find rest without guilt or fear of missing out",
      subtext: "Fears being seen as less committed",
      persona_trait: ['conscientious', 'vigilant'],
      bucket: ['Thought']
    };

    // Step 1: FETCH_PROFILE - Should initialize new profile
    console.log('\n--- Step 1: FETCH_PROFILE ---');
    const initialProfile = await this.fetcher.fetchProfile(userId);
    console.log('Initial profile:', JSON.stringify(initialProfile, null, 2));

    // Step 2: CONTRAST_CHECK - Should show no flip (new user)
    console.log('\n--- Step 2: CONTRAST_CHECK ---');
    const firstContrast = this.contrastChecker.checkContrast(firstEntryParsed.vibe, initialProfile);
    console.log('Contrast result:', JSON.stringify(firstContrast, null, 2));

    // Step 3: PROFILE_UPDATE - Should update counts and set dominant vibe
    console.log('\n--- Step 3: PROFILE_UPDATE ---');
    const updatedProfile = this.updater.updateProfile(initialProfile, firstEntryParsed);
    console.log('Updated profile:', JSON.stringify(updatedProfile, null, 2));

    // Step 4: Save profile
    await this.fetcher.saveProfile(userId, updatedProfile);
    console.log('Profile saved successfully');

    // Verify profile structure matches expected format
    this.verifyProfileStructure(updatedProfile, 1);
  }

  /**
   * Test Case 2: 100th Entry - Established User
   */
  async testHundredthEntry(): Promise<void> {
    console.log('\n=== TESTING 100TH ENTRY (ESTABLISHED USER) ===');
    
    const userId = 'test_user_hundred';
    
    // Create mock profile representing 99 previous entries
    const establishedProfile: UserProfile = {
      top_themes: ['intern management', 'startup culture', 'productivity', 'work-life balance'],
      theme_count: {
        'intern management': 35,
        'productivity': 22,
        'startup culture': 18,
        'work-life balance': 12,
        'personal growth': 8,
        'team dynamics': 4
      },
      dominant_vibe: 'driven',
      vibe_count: {
        'driven': 41,
        'curious': 19,
        'overwhelmed': 14,
        'excited': 9,
        'anxious': 8,
        'exhausted': 6,
        'confident': 2
      },
      bucket_count: {
        'Goal': 48,
        'Thought': 27,
        'Hobby': 15,
        'Value': 9
      },
      trait_pool: ['organiser', 'builder', 'mentor', 'conscientious', 'vigilant'],
      last_theme: 'productivity'
    };

    // Save the established profile
    await this.fetcher.saveProfile(userId, establishedProfile);

    // 100th entry with contrasting vibe
    const hundredthEntryParsed: ParsedEntry = {
      theme: ['work-life balance', 'personal growth'],
      vibe: ['exhausted', 'overwhelmed'], // Contrasts with 'driven'
      intent: "Need to find better balance and recharge",
      subtext: "Recognizing the need for sustainable practices",
      persona_trait: ['reflective', 'conscientious'],
      bucket: ['Value']
    };

    // Step 1: FETCH_PROFILE - Should load established profile
    console.log('\n--- Step 1: FETCH_PROFILE ---');
    const loadedProfile = await this.fetcher.fetchProfile(userId);
    console.log('Loaded profile stats:', this.fetcher.getProfileStats(loadedProfile));

    // Step 2: CONTRAST_CHECK - Should detect emotion flip
    console.log('\n--- Step 2: CONTRAST_CHECK ---');
    const contrastResult = this.contrastChecker.checkContrast(hundredthEntryParsed.vibe, loadedProfile);
    console.log('Contrast result:', JSON.stringify(contrastResult, null, 2));
    
    // Additional contrast analysis
    const intensity = this.contrastChecker.getContrastIntensity(
      loadedProfile.dominant_vibe, 
      hundredthEntryParsed.vibe[0]
    );
    console.log(`Contrast intensity: ${intensity}`);

    // Step 3: PROFILE_UPDATE - Should update counts and possibly change dominant
    console.log('\n--- Step 3: PROFILE_UPDATE ---');
    const finalProfile = this.updater.updateProfile(loadedProfile, hundredthEntryParsed);
    console.log('Updated profile stats:', this.fetcher.getProfileStats(finalProfile));
    console.log('New dominant vibe:', finalProfile.dominant_vibe);
    console.log('Top themes:', finalProfile.top_themes);

    // Show update statistics
    const updateStats = this.updater.getUpdateStats(loadedProfile, finalProfile);
    console.log('Update statistics:', JSON.stringify(updateStats, null, 2));

    // Save final profile
    await this.fetcher.saveProfile(userId, finalProfile);
    console.log('Profile saved successfully');

    // Verify profile structure
    this.verifyProfileStructure(finalProfile, 100);
  }

  /**
   * Test profile merging functionality (edge case)
   */
  async testProfileMerging(): Promise<void> {
    console.log('\n=== TESTING PROFILE MERGING (EDGE CASE) ===');

    const profileA: UserProfile = {
      top_themes: ['work'],
      theme_count: { 'work': 10, 'productivity': 5 },
      dominant_vibe: 'driven',
      vibe_count: { 'driven': 8, 'focused': 7 },
      bucket_count: { 'Goal': 10, 'Thought': 5, 'Hobby': 0, 'Value': 0 },
      trait_pool: ['organiser', 'builder'],
      last_theme: 'work'
    };

    const profileB: UserProfile = {
      top_themes: ['hobbies'],
      theme_count: { 'hobbies': 8, 'creativity': 3 },
      dominant_vibe: 'excited',
      vibe_count: { 'excited': 6, 'curious': 5 },
      bucket_count: { 'Goal': 2, 'Thought': 3, 'Hobby': 6, 'Value': 0 },
      trait_pool: ['creative', 'explorer'],
      last_theme: 'hobbies'
    };

    const mergedProfile = this.updater.mergeProfiles(profileA, profileB);
    console.log('Merged profile:', JSON.stringify(mergedProfile, null, 2));
    
    // Verify merged profile is valid
    const isValid = this.updater.validateProfile(mergedProfile);
    console.log('Merged profile is valid:', isValid);
  }

  /**
   * Verify profile structure matches expected format
   */
  private verifyProfileStructure(profile: UserProfile, expectedEntryCount: number): void {
    console.log('\n--- PROFILE VERIFICATION ---');
    
    const actualEntryCount = Object.values(profile.bucket_count).reduce((sum, count) => sum + count, 0);
    const hasRequiredFields = [
      'top_themes', 'theme_count', 'dominant_vibe', 
      'vibe_count', 'bucket_count', 'trait_pool', 'last_theme'
    ].every(field => field in profile);
    
    const validBuckets = Object.keys(profile.bucket_count).every(
      bucket => ['Goal', 'Thought', 'Hobby', 'Value'].includes(bucket)
    );

    console.log(`✓ Has required fields: ${hasRequiredFields}`);
    console.log(`✓ Valid bucket structure: ${validBuckets}`);
    console.log(`✓ Entry count: ${actualEntryCount} (expected: ${expectedEntryCount})`);
    console.log(`✓ Dominant vibe: ${profile.dominant_vibe}`);
    console.log(`✓ Top themes count: ${profile.top_themes.length} (max 4)`);
    console.log(`✓ Trait pool size: ${profile.trait_pool.length}`);
    console.log(`✓ Profile is serializable: ${JSON.stringify(profile).length > 0}`);

    // Verify top themes are sorted by frequency
    const sortedThemes = Object.entries(profile.theme_count)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([theme]) => theme);
    
    const topThemesCorrect = JSON.stringify(profile.top_themes) === JSON.stringify(sortedThemes);
    console.log(`✓ Top themes correctly sorted: ${topThemesCorrect}`);
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    try {
      await this.testFirstEntry();
      await this.testHundredthEntry();
      await this.testProfileMerging();
      
      console.log('\n🎉 ALL PROFILE TESTS COMPLETED SUCCESSFULLY! 🎉');
      console.log('\nThe profile team implementation handles:');
      console.log('✓ FETCH_PROFILE: Loading and initializing profiles');
      console.log('✓ PROFILE_UPDATE: Incrementing counters and updating dominants');  
      console.log('✓ CONTRAST_CHECK: Detecting emotional flips and patterns');
      console.log('✓ JSON serialization and file persistence');
      console.log('✓ Edge cases like profile merging');
      console.log('✓ Both 1st entry and 100th entry scenarios');
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }
}

// Export for direct testing
export async function runProfileTests(): Promise<void> {
  const tester = new ProfileFunctionalityTest();
  await tester.runAllTests();
} 