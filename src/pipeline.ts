import { 
  ParsedEntry, 
  MetaData, 
  UserProfile, 
  DiaryEntry, 
  PipelineOutput, 
  CarryInResult, 
  ContrastResult 
} from './types';
import { step06_parseEntry } from './steps/parse_entry';
import { step05_metaExtract } from './steps/meta_extract';

export class SentariPipeline {
  private entries: Map<string, DiaryEntry> = new Map();
  private profile: UserProfile | null = null;
  private startTime: number = 0;

  // Step 01: RAW_TEXT_IN
  step01_rawTextIn(transcript: string): string {
    const raw_text = transcript.trim();
    console.log(`[RAW_TEXT_IN] input="${transcript.substring(0, 50)}..." | output="${raw_text.substring(0, 50)}..." | note="Transcript accepted"`);
    return raw_text;
  }

  // Step 02: EMBEDDING - Mock MiniLM vector
  step02_embedding(raw_text: string): number[] {
    // Mock 384-dimensional embedding (all-MiniLM-L6-v2 size)
    const embedding = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    console.log(`[EMBEDDING] input="${raw_text.substring(0, 30)}..." | output="[${embedding.slice(0, 3).map(n => n.toFixed(3)).join(',')}...384d]" | note="[MOCK] MiniLM vector generated"`);
    return embedding;
  }

  // Step 03: FETCH_RECENT
  step03_fetchRecent(): DiaryEntry[] {
    const recent = Array.from(this.entries.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
    console.log(`[FETCH_RECENT] input="" | output="[${recent.length} entries]" | note="Last 5 entries loaded"`);
    return recent;
  }

  // Step 04: FETCH_PROFILE
  step04_fetchProfile(): UserProfile {
    if (!this.profile) {
      this.profile = {
        top_themes: [],
        theme_count: {},
        dominant_vibe: "",
        vibe_count: {},
        bucket_count: {},
        trait_pool: [],
        last_theme: ""
      };
    }
    console.log(`[FETCH_PROFILE] input="" | output="${this.profile.dominant_vibe || 'new_user'}" | note="Profile loaded or initialized"`);
    return this.profile;
  }

  // Step 05: META_EXTRACT
  step05_metaExtract(raw_text: string): MetaData {
    const words = raw_text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const word_freq = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const meta_data: MetaData = {
      word_count: words.length,
      top_words: Object.entries(word_freq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word),
      punctuation_flags: {
        has_exclamation: raw_text.includes('!'),
        has_question: raw_text.includes('?'),
        has_ellipsis: raw_text.includes('...')
      }
    };

    console.log(`[META_EXTRACT] input="${raw_text.substring(0, 30)}..." | output="words:${meta_data.word_count}, top:${meta_data.top_words.slice(0, 2).join(',')}" | note="Metadata extracted"`);
    return meta_data;
  }

  // Step 06: PARSE_ENTRY - Rule-based extraction
  step06_parseEntry(raw_text: string): ParsedEntry {
    const text_lower = raw_text.toLowerCase();
    
    // Theme extraction (nouns, topics)
    const theme_patterns = {
      'work-life balance': /work.*life|balance|slack|overtime|rest/,
      'productivity': /productive|efficiency|focus|task|deadline/,
      'startup culture': /startup|company|team|culture|growth/,
      'intern management': /intern|mentor|junior|manage|guide/,
      'personal growth': /learn|improve|growth|skill|develop/
    };

    const themes = Object.entries(theme_patterns)
      .filter(([, pattern]) => pattern.test(text_lower))
      .map(([theme]) => theme);

    // Vibe extraction (emotions)
    const vibe_patterns = {
      'anxious': /anxious|worried|nervous|scared|stress/,
      'excited': /excited|thrilled|amazing|fantastic|awesome/,
      'exhausted': /exhausted|tired|drained|worn|fatigue/,
      'driven': /driven|motivated|determined|focused|ambitious/,
      'curious': /curious|wonder|interesting|explore|discover/,
      'overwhelmed': /overwhelmed|too much|can't handle|swamped/
    };

    const vibes = Object.entries(vibe_patterns)
      .filter(([, pattern]) => pattern.test(text_lower))
      .map(([vibe]) => vibe);

    // Intent extraction
    const intent_patterns = [
      { pattern: /need.*rest|want.*sleep|should.*relax/, intent: "Find rest without guilt or fear" },
      { pattern: /improve.*productivity|be more efficient/, intent: "Increase work efficiency" },
      { pattern: /learn.*skill|want.*grow/, intent: "Develop new capabilities" },
      { pattern: /help.*team|support.*others/, intent: "Support team members effectively" }
    ];

    const intent = intent_patterns.find(({ pattern }) => pattern.test(text_lower))?.intent || "Express thoughts and feelings";

    // Subtext extraction
    const subtext_patterns = [
      { pattern: /but.*scared|however.*worry/, subtext: "Fear of missing out or falling behind" },
      { pattern: /don't want.*seen|afraid.*think/, subtext: "Concerns about others' perceptions" },
      { pattern: /should.*more|need.*better/, subtext: "Self-imposed pressure to excel" }
    ];

    const subtext = subtext_patterns.find(({ pattern }) => pattern.test(text_lower))?.subtext || "Surface-level expression";

    // Persona traits
    const trait_patterns = {
      'conscientious': /check|ensure|careful|thorough|responsible/,
      'vigilant': /watch|monitor|alert|aware|notice/,
      'organiser': /plan|organize|structure|system|method/,
      'builder': /create|build|develop|make|construct/,
      'mentor': /teach|guide|help|support|share/
    };

    const persona_traits = Object.entries(trait_patterns)
      .filter(([, pattern]) => pattern.test(text_lower))
      .map(([trait]) => trait);

    // Bucket classification
    let bucket = ["Thought"]; // default
    if (/goal|plan|want to|going to/.test(text_lower)) bucket = ["Goal"];
    if (/hobby|fun|enjoy|leisure/.test(text_lower)) bucket = ["Hobby"];
    if (/believe|value|important|principle/.test(text_lower)) bucket = ["Value"];

    const parsed: ParsedEntry = {
      theme: themes.length > 0 ? themes : ["general"],
      vibe: vibes.length > 0 ? vibes : ["neutral"],
      intent,
      subtext,
      persona_trait: persona_traits.length > 0 ? persona_traits : ["reflective"],
      bucket
    };

    console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}" | note="[MOCK] Rule-based extraction"`);
    return parsed;
  }

  // Step 07: CARRY_IN - Theme/vibe overlap or cosine > 0.86
  step07_carryIn(current_embedding: number[], recent_entries: DiaryEntry[], current_themes: string[]): CarryInResult {
    if (recent_entries.length === 0) {
      console.log(`[CARRY_IN] input="no_recent" | output="false" | note="No recent entries to compare"`);
      return { carry_in: false, similarity_score: 0, matching_themes: [] };
    }

    // Check theme overlap
    const recent_themes = recent_entries.flatMap(e => e.parsed.theme);
    const matching_themes = current_themes.filter(theme => recent_themes.includes(theme));
    
    // Mock cosine similarity calculation
    const latest_entry = recent_entries[0];
    const cosine_sim = this.mockCosineSimilarity(current_embedding, latest_entry.embedding);
    
    const carry_in = matching_themes.length > 0 || cosine_sim > 0.86;
    
    console.log(`[CARRY_IN] input="themes:${current_themes.join(',')}, sim:${cosine_sim.toFixed(3)}" | output="${carry_in}" | note="Theme overlap: ${matching_themes.length}, cosine: ${cosine_sim.toFixed(3)}"`);
    
    return {
      carry_in,
      similarity_score: cosine_sim,
      matching_themes
    };
  }

  // Step 08: CONTRAST_CHECK
  step08_contrastCheck(current_vibes: string[], profile: UserProfile): ContrastResult {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes[0] || "neutral";
    
    // Define opposing emotions
    const opposites: Record<string, string[]> = {
      'excited': ['exhausted', 'anxious', 'overwhelmed'],
      'driven': ['exhausted', 'overwhelmed'],
      'anxious': ['excited', 'curious'],
      'exhausted': ['excited', 'driven']
    };

    const emotion_flip = previous_dominant !== "" && 
                        opposites[previous_dominant]?.includes(current_dominant) || false;

    console.log(`[CONTRAST_CHECK] input="prev:${previous_dominant}, curr:${current_dominant}" | output="${emotion_flip}" | note="Emotion contrast detected: ${emotion_flip}"`);
    
    return {
      emotion_flip,
      previous_dominant,
      current_dominant
    };
  }

  // Step 09: PROFILE_UPDATE
  step09_profileUpdate(profile: UserProfile, parsed: ParsedEntry): UserProfile {
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

    // Update trait pool
    parsed.persona_trait.forEach(trait => {
      if (!updated_profile.trait_pool.includes(trait)) {
        updated_profile.trait_pool.push(trait);
      }
    });

    // Recalculate top themes and dominant vibe
    updated_profile.top_themes = Object.entries(updated_profile.theme_count)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([theme]) => theme);

    updated_profile.dominant_vibe = Object.entries(updated_profile.vibe_count)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "";

    updated_profile.last_theme = parsed.theme[0] || "";

    console.log(`[PROFILE_UPDATE] input="themes:${parsed.theme.join(',')}" | output="dominant:${updated_profile.dominant_vibe}" | note="Profile counters updated"`);
    
    this.profile = updated_profile;
    return updated_profile;
  }

  // Step 10: SAVE_ENTRY
  step10_saveEntry(raw_text: string, embedding: number[], parsed: ParsedEntry, meta_data: MetaData): string {
    const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entry: DiaryEntry = {
      id: entryId,
      raw_text,
      embedding,
      parsed,
      meta_data,
      timestamp: new Date()
    };

    this.entries.set(entryId, entry);
    
    console.log(`[SAVE_ENTRY] input="entry_data" | output="${entryId}" | note="Entry saved to memory store"`);
    return entryId;
  }

  // Step 11: GPT_REPLY - Generate empathic response ≤55 chars
  step11_gptReply(parsed: ParsedEntry, profile: UserProfile, carry_in: boolean, emotion_flip: boolean): string {
    const is_first_entry = Object.keys(profile.vibe_count).length <= 1;
    const dominant_vibe = parsed.vibe[0] || "neutral";
    const theme = parsed.theme[0] || "general";

    let response = "";

    if (is_first_entry) {
      // First entry responses
      const first_responses: Record<string, string> = {
        'anxious': "Sounds like you're drained but trying—rest is not failure.",
        'exhausted': "You deserve rest without guilt. Take care of yourself.",
        'driven': "Your motivation shows. Balance drive with self-care.",
        'excited': "Love the energy! Channel it mindfully.",
        'default': "Thanks for sharing. Your feelings are valid."
      };
      response = first_responses[dominant_vibe] || first_responses['default'];
    } else {
      // 100th entry responses with emoji and personalization
      if (carry_in) {
        response = `🧩 You're still ${theme.replace('-', ' ')}-focused! `;
      } else {
        response = `✨ New energy detected: ${dominant_vibe}! `;
      }

      if (emotion_flip) {
        response += "Big shift today 🔄";
      } else {
        response += `${this.getVibeEmoji(dominant_vibe)} Keep going`;
      }
    }

    // Ensure ≤55 chars
    if (response.length > 55) {
      response = response.substring(0, 52) + "...";
    }

    console.log(`[GPT_REPLY] input="vibe:${dominant_vibe}, carry:${carry_in}" | output="${response}" | note="[MOCK] Empathic response generated (${response.length} chars)"`);
    return response;
  }

  // Step 12: PUBLISH
  step12_publish(entryId: string, response_text: string, carry_in: boolean, emotion_flip: boolean, updated_profile: UserProfile): PipelineOutput {
    const output: PipelineOutput = {
      entryId,
      response_text,
      carry_in,
      emotion_flip,
      updated_profile
    };

    console.log(`[PUBLISH] input="entryId:${entryId}" | output="package_ready" | note="Response packaged for delivery"`);
    return output;
  }

  // Step 13: COST_LATENCY_LOG
  step13_costLatencyLog(): void {
    const duration = Date.now() - this.startTime;
    const mock_cost = 0.0015; // Under $0.002 threshold
    
    console.log(`[COST_LATENCY_LOG] input="" | output="duration:${duration}ms, cost:$${mock_cost}" | note="[MOCK] Performance metrics logged"`);
  }

  // Main pipeline execution
  async processDiaryEntry(transcript: string): Promise<PipelineOutput> {
    this.startTime = Date.now();

    // Execute all 13 steps in sequence
    const raw_text = this.step01_rawTextIn(transcript);
    const embedding = this.step02_embedding(raw_text);
    const recent = this.step03_fetchRecent();
    const profile = this.step04_fetchProfile();
    const meta_data = this.step05_metaExtract(raw_text);
    const parsed = this.step06_parseEntry(raw_text);
    const carry_result = this.step07_carryIn(embedding, recent, parsed.theme);
    const contrast_result = this.step08_contrastCheck(parsed.vibe, profile);
    const updated_profile = this.step09_profileUpdate(profile, parsed);
    const entryId = this.step10_saveEntry(raw_text, embedding, parsed, meta_data);
    const response_text = this.step11_gptReply(parsed, updated_profile, carry_result.carry_in, contrast_result.emotion_flip);
    const output = this.step12_publish(entryId, response_text, carry_result.carry_in, contrast_result.emotion_flip, updated_profile);
    this.step13_costLatencyLog();

    return output;
  }

  // Utility methods
  private mockCosineSimilarity(vec1: number[], vec2: number[]): number {
    // Simple mock - in reality would compute actual cosine similarity
    return 0.75 + Math.random() * 0.2; // 0.75-0.95 range
  }

  private getVibeEmoji(vibe: string): string {
    const emojis: Record<string, string> = {
      'excited': '🚀',
      'driven': '💪',
      'anxious': '😰',
      'exhausted': '💤',
      'curious': '🤔',
      'overwhelmed': '😵'
    };
    return emojis[vibe] || '💭';
  }

  // Public methods for testing/simulation
  public getProfile(): UserProfile | null {
    return this.profile;
  }

  public getEntryCount(): number {
    return this.entries.size;
  }

  public loadMockEntries(entries: DiaryEntry[]): void {
    entries.forEach(entry => {
      this.entries.set(entry.id, entry);
    });
  }

  public setProfile(profile: UserProfile): void {
    this.profile = profile;
  }
} 