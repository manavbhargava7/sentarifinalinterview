// Profile Team Implementation
// Main exports for FETCH_PROFILE, PROFILE_UPDATE, and CONTRAST_CHECK functionality

import { ProfileFetcher } from './fetch_profile';
import { ProfileUpdater } from './profile_update';
import { ContrastChecker } from './contrast_check';
import { UserProfile, ContrastResult, ParsedEntry } from '../types';

export { ProfileFetcher, ProfileUpdater, ContrastChecker };
export type { UserProfile, ContrastResult, ParsedEntry };

/**
 * Main Profile Manager - Combines all three profile functions
 * Handles the complete profile lifecycle: fetch -> update -> contrast check
 */
export class ProfileManager {
  private fetcher: ProfileFetcher;
  private updater: ProfileUpdater;
  private contrastChecker: ContrastChecker;

  constructor(profilesDir?: string) {
    this.fetcher = new ProfileFetcher(profilesDir);
    this.updater = new ProfileUpdater();
    this.contrastChecker = new ContrastChecker();
  }

  /**
   * Complete profile processing workflow
   * 1. FETCH_PROFILE: Load or initialize profile
   * 2. PROFILE_UPDATE: Update with new entry data
   * 3. CONTRAST_CHECK: Analyze emotional patterns
   * 4. Save updated profile
   */
  async processProfileUpdate(
    userId: string, 
    parsed: ParsedEntry
  ): Promise<{
    profile: UserProfile;
    contrast: ContrastResult;
    isNewUser: boolean;
  }> {
    // Step 1: FETCH_PROFILE
    const originalProfile = await this.fetcher.fetchProfile(userId);
    const isNewUser = Object.keys(originalProfile.theme_count).length === 0;

    // Step 2: CONTRAST_CHECK (before update to compare with existing state)
    const contrast = this.contrastChecker.checkContrast(parsed.vibe, originalProfile);

    // Step 3: PROFILE_UPDATE
    const updatedProfile = this.updater.updateProfile(originalProfile, parsed);

    // Step 4: Save updated profile
    await this.fetcher.saveProfile(userId, updatedProfile);

    console.log(`[PROFILE_MANAGER] Processed update for user ${userId} | new_user=${isNewUser} | emotion_flip=${contrast.emotion_flip}`);

    return {
      profile: updatedProfile,
      contrast,
      isNewUser
    };
  }

  /**
   * Get profile statistics and insights
   */
  async getProfileInsights(userId: string): Promise<{
    stats: Record<string, any>;
    dominant_patterns: Record<string, any>;
    recommendations: string[];
  }> {
    const profile = await this.fetcher.fetchProfile(userId);
    const stats = this.fetcher.getProfileStats(profile);
    
    const totalEntries = Object.values(profile.bucket_count).reduce((sum, count) => (sum as number) + (count as number), 0);
    
    // Analyze dominant patterns
    const dominant_patterns = {
      most_common_bucket: Object.entries(profile.bucket_count)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'none',
      emotional_stability: totalEntries >= 10 ? 
        (Object.keys(profile.vibe_count).length / totalEntries < 0.5 ? 'stable' : 'variable') : 
        'insufficient_data',
      theme_diversity: Object.keys(profile.theme_count).length,
      trait_richness: profile.trait_pool.length
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (totalEntries < 5) {
      recommendations.push("Continue journaling to build a comprehensive profile");
    }
    
    if (dominant_patterns.emotional_stability === 'variable') {
      recommendations.push("Consider exploring patterns in emotional changes");
    }
    
    if (profile.dominant_vibe === 'overwhelmed' || profile.dominant_vibe === 'exhausted') {
      recommendations.push("Your dominant vibe suggests focusing on stress management");
    }
    
    if (dominant_patterns.most_common_bucket === 'Thought') {
      recommendations.push("You tend to journal about thoughts - consider setting more goals");
    }

    return {
      stats,
      dominant_patterns,
      recommendations
    };
  }

  /**
   * Export profile data in a clean format
   */
  async exportProfile(userId: string): Promise<UserProfile> {
    return await this.fetcher.fetchProfile(userId);
  }

  /**
   * Reset profile (useful for testing or user reset requests)
   */
  async resetProfile(userId: string): Promise<void> {
    const newProfile: UserProfile = {
      top_themes: [],
      theme_count: {},
      dominant_vibe: "",
      vibe_count: {},
      bucket_count: {
        "Goal": 0,
        "Thought": 0,
        "Hobby": 0,
        "Value": 0
      },
      trait_pool: [],
      last_theme: ""
    };
    
    await this.fetcher.saveProfile(userId, newProfile);
    console.log(`[PROFILE_MANAGER] Reset profile for user ${userId}`);
  }
} 