import { DiaryEntry, CarryInResult } from '../types';

export function step07_carryIn(
    current_embedding: number[],
    recent_entries: DiaryEntry[],
    current_themes: string[]
): CarryInResult {
    if (recent_entries.length === 0) {
        console.log(`[CARRY_IN] input="no_recent" | output="false" | note="No recent entries to compare"`);
        return { carry_in: false, similarity_score: 0, matching_themes: [] };
    }

    // Check theme overlap
    const recent_themes = recent_entries.flatMap(e => e.parsed.theme);
    const matching_themes = current_themes.filter(theme => recent_themes.includes(theme));

    // Mock cosine similarity calculation
    const latest_entry = recent_entries[0];
    const cosine_sim = mockCosineSimilarity(current_embedding, latest_entry.embedding);

    const carry_in = matching_themes.length > 0 || cosine_sim > 0.86;

    console.log(`[CARRY_IN] input="themes:${current_themes.join(',')}, sim:${cosine_sim.toFixed(3)}" | output="${carry_in}" | note="Theme overlap: ${matching_themes.length}, cosine: ${cosine_sim.toFixed(3)}"`);

    return {
        carry_in,
        similarity_score: cosine_sim,
        matching_themes
    };
}

function mockCosineSimilarity(vec1: number[], vec2: number[]): number {
    // Mock cosine similarity calculation
    const dot_product = vec1.slice(0, 10).reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.slice(0, 10).reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.slice(0, 10).reduce((sum, val) => sum + val * val, 0));
    return Math.abs(dot_product / (mag1 * mag2));
} 