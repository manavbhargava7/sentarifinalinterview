import { UserProfile, ContrastResult } from '../types';

export function step08_contrastCheck(current_vibes: string[], profile: UserProfile): ContrastResult {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes[0] || "neutral";

    // Define opposing emotions
    const opposites: Record<string, string[]> = {
        'excited': ['exhausted', 'anxious', 'overwhelmed', 'bored'],
        'driven': ['exhausted', 'overwhelmed', 'apathetic'],
        'anxious': ['excited', 'curious', 'confident', 'relaxed'],
        'exhausted': ['excited', 'driven', 'energetic'],
        'curious': ['anxious', 'bored', 'disinterested'],
        'overwhelmed': ['excited', 'driven', 'calm', 'confident'],
        'confident': ['anxious', 'overwhelmed', 'insecure'],
        'calm': ['anxious', 'overwhelmed', 'agitated'],
        'apathetic': ['excited', 'driven', 'energetic', 'curious'],
        'bored': ['excited', 'driven', 'energetic', 'curious'],
        'disinterested': ['excited', 'driven', 'energetic', 'curious'],
        'insecure': ['excited', 'driven', 'energetic', 'curious'],
        'agitated': ['excited', 'driven', 'energetic', 'curious']
    };

    const emotion_flip = opposites[previous_dominant]?.includes(current_dominant) || false;

    console.log(`[CONTRAST_CHECK] input="prev:${previous_dominant}, curr:${current_dominant}" | output="${emotion_flip}" | note="Emotion flip detected: ${emotion_flip}"`);

    return {
        emotion_flip,
        previous_dominant,
        current_dominant
    };
} 