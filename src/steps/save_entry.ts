import { DiaryEntry, ParsedEntry, MetaData } from '../types';

export function step10_saveEntry(
    raw_text: string,
    embedding: number[],
    parsed: ParsedEntry,
    meta_data: MetaData,
    entries: Map<string, DiaryEntry>
): string {
    const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const entry: DiaryEntry = {
        id: entryId,
        raw_text,
        embedding,
        parsed,
        meta_data,
        timestamp: new Date()
    };

    entries.set(entryId, entry);

    console.log(`[SAVE_ENTRY] input="themes:${parsed.theme.join(',')}" | output="${entryId}" | note="Entry saved to storage"`);

    return entryId;
} 