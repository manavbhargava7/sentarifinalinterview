import { UserProfile } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * FETCH_PROFILE: Load existing profile or initialize a new one
 * Handles both file-based persistence and in-memory profiles
 */
export class ProfileFetcher {
  private profilesDir: string;

  constructor(profilesDir: string = './data/profiles') {
    this.profilesDir = profilesDir;
    this.ensureProfilesDirectory();
  }

  /**
   * Fetch profile for a specific user ID
   * @param userId - User identifier
   * @returns UserProfile - either loaded from file or newly initialized
   */
  async fetchProfile(userId: string): Promise<UserProfile> {
    const profilePath = path.join(this.profilesDir, `${userId}.json`);
    
    try {
      // Try to load existing profile
      if (fs.existsSync(profilePath)) {
        const profileData = fs.readFileSync(profilePath, 'utf8');
        const profile = JSON.parse(profileData) as UserProfile;
        
        // Validate profile structure and fix any missing fields
        const validatedProfile = this.validateAndFixProfile(profile);
        
        console.log(`[FETCH_PROFILE] input="user:${userId}" | output="existing_profile" | note="Profile loaded from ${profilePath}"`);
        return validatedProfile;
      }
    } catch (error) {
      console.warn(`[FETCH_PROFILE] Warning: Failed to load profile for ${userId}:`, error);
    }

    // Initialize new profile
    const newProfile = this.initializeNewProfile();
    
    console.log(`[FETCH_PROFILE] input="user:${userId}" | output="new_profile" | note="New profile initialized"`);
    return newProfile;
  }

  /**
   * Initialize a default profile structure for new users
   */
  private initializeNewProfile(): UserProfile {
    return {
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
  }

  /**
   * Validate profile structure and fix any missing fields
   * Handles edge cases where profiles might have missing properties
   */
  private validateAndFixProfile(profile: any): UserProfile {
    const defaultProfile = this.initializeNewProfile();
    
    return {
      top_themes: Array.isArray(profile.top_themes) ? profile.top_themes : defaultProfile.top_themes,
      theme_count: this.isValidObject(profile.theme_count) ? profile.theme_count : defaultProfile.theme_count,
      dominant_vibe: typeof profile.dominant_vibe === 'string' ? profile.dominant_vibe : defaultProfile.dominant_vibe,
      vibe_count: this.isValidObject(profile.vibe_count) ? profile.vibe_count : defaultProfile.vibe_count,
      bucket_count: this.isValidObject(profile.bucket_count) ? 
        { ...defaultProfile.bucket_count, ...profile.bucket_count } : 
        defaultProfile.bucket_count,
      trait_pool: Array.isArray(profile.trait_pool) ? 
        [...new Set(profile.trait_pool.filter((trait: any) => typeof trait === 'string') as string[])] : // Remove duplicates and ensure strings
        defaultProfile.trait_pool,
      last_theme: typeof profile.last_theme === 'string' ? profile.last_theme : defaultProfile.last_theme
    };
  }

  /**
   * Save profile to file system
   * @param userId - User identifier
   * @param profile - Profile data to save
   */
  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    const profilePath = path.join(this.profilesDir, `${userId}.json`);
    
    try {
      // Ensure profile is serializable
      const serializedProfile = JSON.stringify(profile, null, 2);
      fs.writeFileSync(profilePath, serializedProfile, 'utf8');
      
      console.log(`[FETCH_PROFILE] Profile saved for user ${userId} to ${profilePath}`);
    } catch (error) {
      console.error(`[FETCH_PROFILE] Error saving profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if profiles directory exists, create if needed
   */
  private ensureProfilesDirectory(): void {
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Helper to validate if value is a valid object (not null, not array)
   */
  private isValidObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Get profile statistics for debugging
   */
  getProfileStats(profile: UserProfile): Record<string, any> {
    const totalEntries = Object.values(profile.bucket_count).reduce((sum, count) => sum + count, 0);
    const totalThemes = Object.keys(profile.theme_count).length;
    const totalVibes = Object.keys(profile.vibe_count).length;
    
    return {
      total_entries: totalEntries,
      unique_themes: totalThemes,
      unique_vibes: totalVibes,
      trait_count: profile.trait_pool.length,
      has_dominant_vibe: !!profile.dominant_vibe,
      top_themes_count: profile.top_themes.length
    };
  }
} 