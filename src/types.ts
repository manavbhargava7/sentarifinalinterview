export interface ParsedEntry {
  theme: string[];
  vibe: string[];
  intent: string;
  subtext: string;
  persona_trait: string[];
  bucket: string[];
}

export interface MetaData {
  word_count: number;
  top_words: string[];
  punctuation_flags: {
    has_exclamation: boolean;
    has_question: boolean;
    has_ellipsis: boolean;
  };
}

export interface UserProfile {
  top_themes: string[];
  theme_count: Record<string, number>;
  dominant_vibe: string;
  vibe_count: Record<string, number>;
  bucket_count: Record<string, number>;
  trait_pool: string[];
  last_theme: string;
}

export interface DiaryEntry {
  id: string;
  raw_text: string;
  embedding: number[];
  parsed: ParsedEntry;
  meta_data: MetaData;
  timestamp: Date;
}

export interface PipelineOutput {
  entryId: string;
  response_text: string;
  carry_in: boolean;
  emotion_flip: boolean;
  updated_profile: UserProfile;
}

export interface CarryInResult {
  carry_in: boolean;
  similarity_score: number;
  matching_themes: string[];
}

export interface ContrastResult {
  emotion_flip: boolean;
  previous_dominant: string;
  current_dominant: string;
  contrast_type?: string | null;
  intensity_shift?: 'high-to-low' | 'low-to-high' | 'none';
  pattern_disruption?: boolean;
} 