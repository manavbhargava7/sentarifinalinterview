import { UserProfile } from '../types';

export function step04_fetchProfile(profile: UserProfile | null): UserProfile {
    if (!profile) {
        profile = {
            top_themes: [],
            theme_count: {},
            dominant_vibe: "",
            vibe_count: {},
            bucket_count: {},
            trait_pool: [],
            last_theme: ""
        };
    }
    console.log(`[FETCH_PROFILE] input="" | output="${profile.dominant_vibe || 'new_user'}" | note="Profile loaded or initialized"`);
    return profile;
} 