import { DiaryEntry } from '../types';

export function step03_fetchRecent(entries: Map<string, DiaryEntry>): DiaryEntry[] {
    const recent = Array.from(entries.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    console.log(`[FETCH_RECENT] input="" | output="[${recent.length} entries]" | note="Last 5 entries loaded"`);
    return recent;
} 