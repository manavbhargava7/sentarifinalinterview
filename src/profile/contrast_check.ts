import { UserProfile, ContrastResult } from '../types';

/**
 * CONTRAST_CHECK: Compare vibe flip logic and detect emotional contrasts
 * Handles emotion transition analysis and behavioral pattern recognition
 */
export class ContrastChecker {
  
  // Define opposing emotion pairs for contrast detection
  private readonly oppositeEmotions: Record<string, string[]> = {
    'excited': ['exhausted', 'anxious', 'overwhelmed', 'bored'],
    'driven': ['exhausted', 'overwhelmed', 'apathetic'],
    'anxious': ['excited', 'curious', 'confident', 'relaxed'],
    'exhausted': ['excited', 'driven', 'energetic'],
    'curious': ['anxious', 'bored', 'disinterested'],
    'overwhelmed': ['excited', 'driven', 'calm', 'confident'],
    'confident': ['anxious', 'overwhelmed', 'insecure'],
    'calm': ['anxious', 'overwhelmed', 'agitated']
  };

  // Define related emotions that are similar (not contrasts)
  private readonly relatedEmotions: Record<string, string[]> = {
    'excited': ['curious', 'driven', 'confident'],
    'driven': ['excited', 'confident', 'motivated'],
    'anxious': ['overwhelmed', 'stressed', 'worried'],
    'exhausted': ['overwhelmed', 'drained', 'tired'],
    'curious': ['excited', 'interested', 'engaged'],
    'overwhelmed': ['anxious', 'exhausted', 'stressed']
  };

  /**
   * Check for emotional contrasts between current vibes and profile history
   * @param current_vibes - Current entry's emotional vibes
   * @param profile - User's profile with historical data
   * @returns Contrast analysis result
   */
  checkContrast(current_vibes: string[], profile: UserProfile): ContrastResult {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes.length > 0 ? current_vibes[0] : "neutral";
    
    // Check for emotion flip
    const emotion_flip = this.detectEmotionFlip(previous_dominant, current_dominant);
    
    // Additional contrast checks
    const intensity_contrast = this.checkIntensityContrast(previous_dominant, current_dominant);
    const pattern_break = this.checkPatternBreak(current_vibes, profile);
    
    const result: ContrastResult = {
      emotion_flip,
      previous_dominant,
      current_dominant,
      contrast_type: this.getContrastType(previous_dominant, current_dominant),
      intensity_shift: intensity_contrast,
      pattern_disruption: pattern_break
    };

    console.log(`[CONTRAST_CHECK] input="prev:${previous_dominant}, curr:${current_dominant}" | output="${emotion_flip}" | note="Emotion contrast: ${result.contrast_type || 'none'}, intensity: ${intensity_contrast}"`);
    
    return result;
  }

  /**
   * Detect if there's an emotional flip between previous and current dominants
   */
  private detectEmotionFlip(previous: string, current: string): boolean {
    // No flip if no previous dominant or same emotion
    if (!previous || previous === current) {
      return false;
    }

    // Check if emotions are direct opposites
    const isOpposite = this.oppositeEmotions[previous]?.includes(current) || false;
    
    // Check if emotions are in different emotional categories
    const categoryFlip = this.checkCategoryFlip(previous, current);
    
    return isOpposite || categoryFlip;
  }

  /**
   * Check for intensity-based contrasts (high->low energy, etc.)
   */
  private checkIntensityContrast(previous: string, current: string): 'high-to-low' | 'low-to-high' | 'none' {
    const highIntensity = ['excited', 'driven', 'anxious', 'overwhelmed'];
    const lowIntensity = ['exhausted', 'calm', 'neutral', 'relaxed'];
    
    const prevHigh = highIntensity.includes(previous);
    const prevLow = lowIntensity.includes(previous);
    const currHigh = highIntensity.includes(current);
    const currLow = lowIntensity.includes(current);
    
    if (prevHigh && currLow) return 'high-to-low';
    if (prevLow && currHigh) return 'low-to-high';
    return 'none';
  }

  /**
   * Check if current vibes break established patterns
   */
  private checkPatternBreak(current_vibes: string[], profile: UserProfile): boolean {
    // If profile has fewer than 5 entries, not enough pattern data
    const totalEntries = Object.values(profile.bucket_count).reduce((sum, count) => sum + count, 0);
    if (totalEntries < 5) {
      return false;
    }

    // Check if current vibes are completely absent from historical data
    const historicalVibes = Object.keys(profile.vibe_count);
    const isNewVibe = current_vibes.some(vibe => !historicalVibes.includes(vibe));
    
    // Check if current dominant vibe is very rare (< 10% of total)
    const currentDominant = current_vibes[0];
    if (currentDominant && profile.vibe_count[currentDominant]) {
      const vibeFrequency = profile.vibe_count[currentDominant] / totalEntries;
      return vibeFrequency < 0.1; // Less than 10% is considered pattern break
    }
    
    return isNewVibe;
  }

  /**
   * Determine the type of contrast detected
   */
  private getContrastType(previous: string, current: string): string | null {
    if (!previous || previous === current) {
      return null;
    }

    // Direct opposites
    if (this.oppositeEmotions[previous]?.includes(current)) {
      return 'direct-opposite';
    }

    // Category changes
    const categories = {
      positive: ['excited', 'curious', 'confident', 'happy'],
      negative: ['anxious', 'exhausted', 'overwhelmed', 'sad'],
      neutral: ['neutral', 'calm', 'focused']
    };

    const prevCategory = Object.entries(categories).find(([, emotions]) => emotions.includes(previous))?.[0];
    const currCategory = Object.entries(categories).find(([, emotions]) => emotions.includes(current))?.[0];

    if (prevCategory && currCategory && prevCategory !== currCategory) {
      return `${prevCategory}-to-${currCategory}`;
    }

    return 'subtle-shift';
  }

  /**
   * Check if emotions are in different broad categories
   */
  private checkCategoryFlip(previous: string, current: string): boolean {
    const emotionCategories = {
      'energy-high': ['excited', 'driven', 'curious'],
      'energy-low': ['exhausted', 'calm', 'relaxed'],
      'stress-high': ['anxious', 'overwhelmed', 'worried'],
      'stress-low': ['confident', 'calm', 'relaxed'],
      'engagement-high': ['excited', 'curious', 'driven'],
      'engagement-low': ['bored', 'disinterested', 'apathetic']
    };

    const prevCategories = Object.entries(emotionCategories)
      .filter(([, emotions]) => emotions.includes(previous))
      .map(([category]) => category.split('-')[0]);

    const currCategories = Object.entries(emotionCategories)
      .filter(([, emotions]) => emotions.includes(current))
      .map(([category]) => category.split('-')[0]);

    // Check if they're in different primary categories
    return prevCategories.some(prevCat => 
      !currCategories.some(currCat => prevCat === currCat)
    );
  }

  /**
   * Get contrast intensity score (0-1, where 1 is maximum contrast)
   */
  getContrastIntensity(previous: string, current: string): number {
    if (!previous || previous === current) {
      return 0;
    }

    // Direct opposites get highest score
    if (this.oppositeEmotions[previous]?.includes(current)) {
      return 1.0;
    }

    // Related emotions get lower score
    if (this.relatedEmotions[previous]?.includes(current)) {
      return 0.2;
    }

    // Different categories get medium score
    if (this.checkCategoryFlip(previous, current)) {
      return 0.6;
    }

    // Default subtle shift
    return 0.3;
  }

  /**
   * Check if current state suggests emotional instability
   */
  checkEmotionalStability(recent_vibes: string[][], window_size: number = 5): {
    stability_score: number;
    is_unstable: boolean;
    pattern: string;
  } {
    if (recent_vibes.length < window_size) {
      return {
        stability_score: 1.0,
        is_unstable: false,
        pattern: 'insufficient-data'
      };
    }

    const recentDominants = recent_vibes.slice(-window_size).map(vibes => vibes[0] || 'neutral');
    
    // Count unique emotions in window
    const uniqueEmotions = new Set(recentDominants).size;
    const flipCount = this.countFlipsInSequence(recentDominants);
    
    // Calculate stability score (lower = less stable)
    const stability_score = Math.max(0, 1 - (flipCount / (window_size - 1)) - (uniqueEmotions / window_size));
    
    const is_unstable = stability_score < 0.4; // Threshold for instability
    
    let pattern = 'stable';
    if (flipCount >= window_size - 1) pattern = 'highly-volatile';
    else if (flipCount >= (window_size - 1) / 2) pattern = 'moderately-volatile';
    else if (uniqueEmotions === 1) pattern = 'consistent';
    
    return {
      stability_score,
      is_unstable,
      pattern
    };
  }

  /**
   * Count emotional flips in a sequence
   */
  private countFlipsInSequence(emotions: string[]): number {
    let flipCount = 0;
    for (let i = 1; i < emotions.length; i++) {
      if (this.detectEmotionFlip(emotions[i-1], emotions[i])) {
        flipCount++;
      }
    }
    return flipCount;
  }

  /**
   * Suggest intervention based on contrast patterns
   */
  suggestIntervention(contrast: ContrastResult, stability: { stability_score: number; is_unstable: boolean; pattern: string }): string {
    if (stability.is_unstable && stability.pattern === 'highly-volatile') {
      return "Consider tracking triggers for emotional volatility";
    }
    
    if (contrast.emotion_flip && contrast.contrast_type === 'direct-opposite') {
      return "Significant emotional shift detected - consider reflecting on what changed";
    }
    
    if (contrast.intensity_shift === 'high-to-low') {
      return "Energy drop detected - might be good time for rest or self-care";
    }
    
    if (contrast.intensity_shift === 'low-to-high') {
      return "Energy increase detected - good time for tackling challenges";
    }
    
    return "Emotional state is stable";
  }
} 