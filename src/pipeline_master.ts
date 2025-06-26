import {
    ParsedEntry,
    MetaData,
    UserProfile,
    DiaryEntry,
    PipelineOutput,
    CarryInResult,
    ContrastResult
} from './types';

// Import all step functions
import {
    step01_rawTextIn,
    step02_embedding,
    step03_fetchRecent,
    step04_fetchProfile,
    step05_metaExtract,
    step06_parseEntry,
    step07_carryIn,
    step08_contrastCheck,
    step09_profileUpdate,
    step10_saveEntry,
    step11_gptReply,
    step12_publish,
    step13_costLatencyLog
} from './steps';

export class SentariPipeline {
    private entries: Map<string, DiaryEntry> = new Map();
    private profile: UserProfile | null = null;
    private startTime: number = 0;

    async processDiaryEntry(transcript: string): Promise<PipelineOutput> {
        this.startTime = Date.now();

        // Step 01: RAW_TEXT_IN
        const raw_text = step01_rawTextIn(transcript);

        // Step 02: EMBEDDING
        const embedding = step02_embedding(raw_text);

        // Step 03: FETCH_RECENT
        const recent_entries = step03_fetchRecent(this.entries);

        // Step 04: FETCH_PROFILE
        const current_profile = step04_fetchProfile(this.profile);

        // Step 05: META_EXTRACT
        const meta_data = step05_metaExtract(raw_text);

        // Step 06: PARSE_ENTRY
        const parsed = step06_parseEntry(raw_text);

        // Step 07: CARRY_IN
        const carry_in_result = step07_carryIn(embedding, recent_entries, parsed.theme);

        // Step 08: CONTRAST_CHECK
        const contrast_result = await step08_contrastCheck(parsed.vibe, current_profile, raw_text);

        // Step 09: PROFILE_UPDATE
        const updated_profile = step09_profileUpdate(current_profile, parsed);

        // Step 10: SAVE_ENTRY
        const entryId = step10_saveEntry(raw_text, embedding, parsed, meta_data, this.entries);

        // Step 11: GPT_REPLY
        const response_text = step11_gptReply(parsed, updated_profile, carry_in_result.carry_in, contrast_result.emotion_flip);

        // Step 12: PUBLISH
        const output = step12_publish(entryId, response_text, carry_in_result.carry_in, contrast_result.emotion_flip, updated_profile);

        // Step 13: COST_LATENCY_LOG
        step13_costLatencyLog(this.startTime);

        // Update internal state
        this.profile = updated_profile;

        return output;
    }

    // Utility methods
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