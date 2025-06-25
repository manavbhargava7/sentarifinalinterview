import { UserProfile, ParsedEntry } from '../types';

/**
 * PROFILE_UPDATE: Increment counters and update dominant vibe logic
 * Handles count-based updates and determines top themes/vibes
 */
export class ProfileUpdater {

  /**
   * Update user profile with new diary entry data
   * @param profile - Current user profile
   * @param parsed - Parsed entry data
   * @returns Updated profile with incremented counts and recalculated dominants
   */
  updateProfile(profile: UserProfile, parsed: ParsedEntry): UserProfile {
    const updatedProfile = this.deepCloneProfile(profile);

    // Update counts
    this.updateThemeCounts(updatedProfile, parsed.theme);
    this.updateVibeCounts(updatedProfile, parsed.vibe);
    this.updateBucketCounts(updatedProfile, parsed.bucket);
    this.updateTraitPool(updatedProfile, parsed.persona_trait);

    // Update last theme
    updatedProfile.last_theme = parsed.theme.length > 0 ? parsed.theme[0] : updatedProfile.last_theme;

    // Recalculate dominant values
    updatedProfile.dominant_vibe = this.calculateDominantVibe(updatedProfile.vibe_count);
    updatedProfile.top_themes = this.calculateTopThemes(updatedProfile.theme_count);

    console.log(`[PROFILE_UPDATE] input="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}" | output="dominant:${updatedProfile.dominant_vibe}, top_themes:${updatedProfile.top_themes.length}" | note="Profile updated with new counts"`);

    return updatedProfile;
  }

  /**
   * Update theme counts from parsed entry
   */
  private updateThemeCounts(profile: UserProfile, themes: string[]): void {
    themes.forEach(theme => {
      profile.theme_count[theme] = (profile.theme_count[theme] || 0) + 1;
    });
  }

  /**
   * Update vibe counts from parsed entry
   */
  private updateVibeCounts(profile: UserProfile, vibes: string[]): void {
    vibes.forEach(vibe => {
      profile.vibe_count[vibe] = (profile.vibe_count[vibe] || 0) + 1;
    });
  }

  /**
   * Update bucket counts from parsed entry
   */
  private updateBucketCounts(profile: UserProfile, buckets: string[]): void {
    buckets.forEach(bucket => {
      if (bucket === "Goal" || bucket === "Thought" || bucket === "Hobby" || bucket === "Value") {
        profile.bucket_count[bucket] = (profile.bucket_count[bucket] || 0) + 1;
      }
    });
  }

  /**
   * Update trait pool with new traits (avoid duplicates)
   */
  private updateTraitPool(profile: UserProfile, traits: string[]): void {
    traits.forEach(trait => {
      if (!profile.trait_pool.includes(trait)) {
        profile.trait_pool.push(trait);
      }
    });
  }

  /**
   * Calculate dominant vibe based on highest count
   * @param vibe_count - Object with vibe counts
   * @returns Most frequent vibe or empty string if none
   */
  private calculateDominantVibe(vibe_count: Record<string, number>): string {
    if (Object.keys(vibe_count).length === 0) {
      return "";
    }

    const sortedVibes = Object.entries(vibe_count)
      .sort(([, countA], [, countB]) => countB - countA);

    return sortedVibes[0]?.[0] || "";
  }

  /**
   * Calculate top 4 themes based on highest counts
   * @param theme_count - Object with theme counts
   * @returns Array of top 4 themes sorted by frequency
   */
  private calculateTopThemes(theme_count: Record<string, number>): string[] {
    return Object.entries(theme_count)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 4)
      .map(([theme]) => theme);
  }

  /**
   * Deep clone profile to avoid mutations
   */
  private deepCloneProfile(profile: UserProfile): UserProfile {
    return {
      top_themes: [...profile.top_themes],
      theme_count: { ...profile.theme_count },
      dominant_vibe: profile.dominant_vibe,
      vibe_count: { ...profile.vibe_count },
      bucket_count: { ...profile.bucket_count },
      trait_pool: [...profile.trait_pool],
      last_theme: profile.last_theme
    };
  }

  /**
   * Merge profiles (useful for handling edge cases)
   * @param profileA - First profile
   * @param profileB - Second profile
   * @returns Merged profile with combined counts
   */
  mergeProfiles(profileA: UserProfile, profileB: UserProfile): UserProfile {
    const merged: UserProfile = this.deepCloneProfile(profileA);

    // Merge theme counts
    Object.entries(profileB.theme_count).forEach(([theme, count]) => {
      merged.theme_count[theme] = (merged.theme_count[theme] || 0) + count;
    });

    // Merge vibe counts
    Object.entries(profileB.vibe_count).forEach(([vibe, count]) => {
      merged.vibe_count[vibe] = (merged.vibe_count[vibe] || 0) + count;
    });

    // Merge bucket counts
    Object.entries(profileB.bucket_count).forEach(([bucket, count]) => {
      if (bucket === "Goal" || bucket === "Thought" || bucket === "Hobby" || bucket === "Value") {
        merged.bucket_count[bucket] = (merged.bucket_count[bucket] || 0) + count;
      }
    });

    // Merge trait pools
    profileB.trait_pool.forEach(trait => {
      if (!merged.trait_pool.includes(trait)) {
        merged.trait_pool.push(trait);
      }
    });

    // Use most recent last_theme
    merged.last_theme = profileB.last_theme || merged.last_theme;

    // Recalculate dominants
    merged.dominant_vibe = this.calculateDominantVibe(merged.vibe_count);
    merged.top_themes = this.calculateTopThemes(merged.theme_count);

    console.log(`[PROFILE_UPDATE] Merged two profiles | output="dominant:${merged.dominant_vibe}, themes:${merged.top_themes.length}" | note="Profile merge completed"`);

    return merged;
  }

  /**
   * Validate updated profile structure
   * @param profile - Profile to validate
   * @returns Boolean indicating if profile is valid
   */
  validateProfile(profile: UserProfile): boolean {
    try {
      // Check required fields exist
      const requiredFields = ['top_themes', 'theme_count', 'dominant_vibe', 'vibe_count', 'bucket_count', 'trait_pool', 'last_theme'];
      const hasAllFields = requiredFields.every(field => field in profile);

      // Check types
      const validTypes = 
        Array.isArray(profile.top_themes) &&
        typeof profile.theme_count === 'object' &&
        typeof profile.dominant_vibe === 'string' &&
        typeof profile.vibe_count === 'object' &&
        typeof profile.bucket_count === 'object' &&
        Array.isArray(profile.trait_pool) &&
        typeof profile.last_theme === 'string';

      // Check bucket count keys
      const validBuckets = ['Goal', 'Thought', 'Hobby', 'Value'];
      const bucketKeysValid = Object.keys(profile.bucket_count).every(key => validBuckets.includes(key));

      return hasAllFields && validTypes && bucketKeysValid;
    } catch {
      return false;
    }
  }

  /**
   * Get update statistics for debugging
   */
  getUpdateStats(oldProfile: UserProfile, newProfile: UserProfile): Record<string, any> {
    const oldTotal = Object.values(oldProfile.bucket_count).reduce((sum, count) => sum + count, 0);
    const newTotal = Object.values(newProfile.bucket_count).reduce((sum, count) => sum + count, 0);
    
    return {
      entries_added: newTotal - oldTotal,
      vibe_changed: oldProfile.dominant_vibe !== newProfile.dominant_vibe,
      new_themes: Object.keys(newProfile.theme_count).length - Object.keys(oldProfile.theme_count).length,
      new_traits: newProfile.trait_pool.length - oldProfile.trait_pool.length,
      top_themes_changed: JSON.stringify(oldProfile.top_themes) !== JSON.stringify(newProfile.top_themes)
    };
  }
} 