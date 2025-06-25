import { MetaData } from '../types';

export function step05_metaExtract(raw_text: string): MetaData {
    const words = raw_text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const word_freq = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const meta_data: MetaData = {
        word_count: words.length,
        top_words: Object.entries(word_freq)
            .sort(([, a], [, b]) => b - a)
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