Profile Notes on Implementation:

Profile is currently stored in the pipeline class as a private instance variable. 

There is no file based storage, and each pipeline instance maintains its own profile state.

Profile follows structure of UserProfile type in types.ts:

interface UserProfile {
  top_themes: string[];
  theme_count: Record<string, number>;
  dominant_vibe: string;
  vibe_count: Record<string, number>;
  bucket_count: Record<string, number>;
  trait_pool: string[];
  last_theme: string;
}

Profile Lifecycle:

1. Starts at Step 4 with FETCH_PROFILE:
- creates a blank profile when first accessed
- currently does not have external loading

2. Contrast Check (Step 8)
- has very simple logic for updating profile, has a brief lookup table to determine if the emotion has flipped. returns true or false if so. no pattern detection or intensity analysis. 

3. Profile Update (Step 9)
- Increments count for theme, vibe, and bucket
- Recalculates top themes, and dominant vibes and in-place updates it

