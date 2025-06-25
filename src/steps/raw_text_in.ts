export function step01_rawTextIn(transcript: string): string {
    const raw_text = transcript.trim();
    console.log(`[RAW_TEXT_IN] input="${transcript.substring(0, 50)}..." | output="${raw_text.substring(0, 50)}..." | note="Transcript accepted"`);
    return raw_text;
} 