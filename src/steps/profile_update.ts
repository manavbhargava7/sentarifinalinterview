import { UserProfile, ParsedEntry } from '../types';

export function step09_profileUpdate(profile: UserProfile, parsed: ParsedEntry): UserProfile {
    const updated_profile = { ...profile };

    // Update theme counts
    parsed.theme.forEach(theme => {
        updated_profile.theme_count[theme] = (updated_profile.theme_count[theme] || 0) + 1;
    });

    // Update vibe counts
    parsed.vibe.forEach(vibe => {
        updated_profile.vibe_count[vibe] = (updated_profile.vibe_count[vibe] || 0) + 1;
    });

    // Update bucket counts
    parsed.bucket.forEach(bucket => {
        updated_profile.bucket_count[bucket] = (updated_profile.bucket_count[bucket] || 0) + 1;
    });

    // Update top themes (keep top 4)
    const sorted_themes = Object.entries(updated_profile.theme_count)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([theme]) => theme);
    updated_profile.top_themes = sorted_themes;

    // Update dominant vibe
    const sorted_vibes = Object.entries(updated_profile.vibe_count)
        .sort(([, a], [, b]) => b - a);
    updated_profile.dominant_vibe = sorted_vibes.length > 0 ? sorted_vibes[0][0] : "";

    // Update trait pool (add new traits, keep unique)
    const new_traits = parsed.persona_trait.filter(trait =>
        !updated_profile.trait_pool.includes(trait)
    );
    updated_profile.trait_pool = [...updated_profile.trait_pool, ...new_traits];

    // Update last theme
    updated_profile.last_theme = parsed.theme[0] || "";

    console.log(`[PROFILE_UPDATE] input="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}" | output="dominant:${updated_profile.dominant_vibe}, themes:${updated_profile.top_themes.length}" | note="Profile updated with new data"`);

    return updated_profile;
} 