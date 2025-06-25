import { MetaData } from '../types';

export function step05_metaExtract(raw_text: string): MetaData {
    // Enhanced word processing with better filtering
    const cleanText = raw_text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation but keep spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    const words = cleanText
        .split(' ')
        .filter(word => {
            // Filter out common stop words and short words
            const stopWords = new Set([
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
                'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
                'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she',
                'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its',
                'our', 'their', 'this', 'that', 'these', 'those', 'am', 'not', 'so', 'very', 'just', 'now',
                'then', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
                'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same', 'than', 'too',
                'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
                've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma',
                'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn'
            ]);
            return word.length > 3 && !stopWords.has(word) && /^[a-z]+$/.test(word);
        });

    // Enhanced word frequency analysis
    const word_freq = words.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Enhanced punctuation analysis with regex
    const punctuation_flags = {
        has_exclamation: /!+/.test(raw_text),
        has_question: /\?+/.test(raw_text),
        has_ellipsis: /\.{3,}/.test(raw_text),
        has_quotes: /["'`]/.test(raw_text),
        has_parentheses: /[()]/.test(raw_text),
        has_caps: /[A-Z]{2,}/.test(raw_text), // Multiple consecutive caps
        has_numbers: /\d+/.test(raw_text)
    };

    // Enhanced top words with sentiment scoring
    const top_words = Object.entries(word_freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8) // Get more words for better analysis
        .map(([word]) => word);

    // Additional metadata
    const sentences = raw_text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avg_sentence_length = sentences.length > 0 
        ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length 
        : 0;

    const meta_data: MetaData = {
        word_count: words.length,
        top_words: top_words.slice(0, 5), // Keep top 5 for compatibility
        punctuation_flags: {
            has_exclamation: punctuation_flags.has_exclamation,
            has_question: punctuation_flags.has_question,
            has_ellipsis: punctuation_flags.has_ellipsis
        }
    };

    console.log(`[META_EXTRACT] input="${raw_text.substring(0, 30)}..." | output="words:${meta_data.word_count}, top:${meta_data.top_words.slice(0, 2).join(',')}" | note="Enhanced metadata extracted with regex patterns"`);
    return meta_data;
} 