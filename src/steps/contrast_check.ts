import { UserProfile, ContrastResult } from '../types';

export function step08_contrastCheck(current_vibes: string[], profile: UserProfile): ContrastResult {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes[0] || "neutral";

    // Define opposing emotions
    const opposites: Record<string, string[]> = {
        'excited': ['exhausted', 'anxious', 'overwhelmed'],
        'driven': ['exhausted', 'overwhelmed'],
        'anxious': ['excited', 'curious'],
        'exhausted': ['excited', 'driven'],
        'curious': ['anxious', 'overwhelmed'],
        'overwhelmed': ['excited', 'curious']
    };

    const emotion_flip = opposites[previous_dominant]?.includes(current_dominant) || false;

    console.log(`[CONTRAST_CHECK] input="prev:${previous_dominant}, curr:${current_dominant}" | output="${emotion_flip}" | note="Emotion flip detected: ${emotion_flip}"`);

    return {
        emotion_flip,
        previous_dominant,
        current_dominant
    };
} 