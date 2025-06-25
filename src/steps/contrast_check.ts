import { UserProfile, ContrastResult } from '../types';

let sentenceTransformer: any = null;

// NLP-enhanced emotion flip detection using sentence-transformers
export async function step08_contrastCheck(current_vibes: string[], profile: UserProfile, raw_text: string): Promise<ContrastResult> {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes[0] || "neutral";

    // Rule-based check (fallback in case NLP doesn't work)
    const opposites: Record<string, string[]> = {
        'excited': ['exhausted', 'anxious', 'overwhelmed', 'bored'],
        'driven': ['exhausted', 'overwhelmed', 'apathetic'],
        'anxious': ['excited', 'curious', 'confident', 'relaxed'],
        'exhausted': ['excited', 'driven', 'energetic'],
        'curious': ['anxious', 'bored', 'disinterested'],
        'overwhelmed': ['excited', 'driven', 'calm', 'confident'],
        'confident': ['anxious', 'overwhelmed', 'insecure'],
        'calm': ['anxious', 'overwhelmed', 'agitated'],
        'apathetic': ['excited', 'driven', 'energetic', 'curious'],
        'bored': ['excited', 'driven', 'energetic', 'curious'],
        'disinterested': ['excited', 'driven', 'energetic', 'curious'],
        'insecure': ['excited', 'driven', 'energetic', 'curious'],
        'agitated': ['excited', 'driven', 'energetic', 'curious']
    };

    let rule_based_flip = opposites[previous_dominant]?.includes(current_dominant) || false;

    // Enhanced NLP-based detection using sentence-transformers
    let nlp_flip = false;
    let confidence = 0.5;

    if (raw_text && previous_dominant && previous_dominant !== "") {
        try {
            const nlpResult = await detectSemanticFlip(raw_text, previous_dominant, current_dominant);
            nlp_flip = nlpResult.has_flip;
            confidence = nlpResult.confidence;
        } catch (error) {
            console.warn("NLP analysis failed, using rule-based only:", error);
        }
    }

    // Combine rule-based and NLP results
    const final_flip = rule_based_flip || nlp_flip;
    const final_confidence = Math.max(confidence, rule_based_flip ? 0.7 : 0.3);

    console.log(`[CONTRAST_CHECK] input="prev:${previous_dominant}, curr:${current_dominant}" | output="${final_flip}" | note="Rule: ${rule_based_flip}, NLP: ${nlp_flip}, confidence: ${final_confidence.toFixed(2)}"`);

    return {
        emotion_flip: final_flip,
        previous_dominant,
        current_dominant
    };
}

// NLP-based semantic emotion flip detection using all-MiniLM-L6-v2
async function detectSemanticFlip(text: string, prev_emotion: string, curr_emotion: string): Promise<{ has_flip: boolean, confidence: number }> {
    // Import transformers dynamically with proper ES module handling
    let pipeline: any;
    try {
        const transformers = await eval('import("@xenova/transformers")');
        pipeline = transformers.pipeline;
    } catch (error) {
        throw new Error(`Failed to import transformers: ${error}`);
    }
    
    // Initialize the sentence-transformer model (all-MiniLM-L6-v2) - reuse if already loaded
    if (!sentenceTransformer) {
        console.log('🔄 Loading all-MiniLM-L6-v2 model...');
        sentenceTransformer = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Model loaded successfully!');
    }

    // Define emotion reference texts for semantic comparison
    const emotion_references: Record<string, string> = {
        'excited': 'I feel excited, energetic, and enthusiastic about everything',
        'driven': 'I am motivated, determined, and focused on achieving my goals',
        'anxious': 'I feel worried, nervous, and stressed about things',
        'exhausted': 'I am tired, drained, and completely worn out',
        'overwhelmed': 'I feel swamped, stressed, and unable to cope with everything',
        'curious': 'I am interested, intrigued, and want to learn more',
        'confident': 'I feel sure, self-assured, and capable of handling things',
        'frustrated': 'I am annoyed, irritated, and fed up with the situation',
        'happy': 'I feel joyful, content, and pleased with how things are',
        'sad': 'I feel down, unhappy, and melancholy about things',
        'calm': 'I feel peaceful, relaxed, and serene',
        'bored': 'I feel uninterested, restless, and lacking stimulation',
        'apathetic': 'I feel indifferent, unmotivated, and emotionally flat',
        'energetic': 'I feel full of energy, vibrant, and ready to take action',
        'relaxed': 'I feel at ease, comfortable, and stress-free',
        'insecure': 'I feel uncertain, self-doubting, and lacking confidence',
        'agitated': 'I feel restless, irritated, and unable to stay calm'
    };

    // generate embeddings for the input text and emotion references
    const text_embedding_raw = await sentenceTransformer(text);
    const text_embedding = meanPooling(text_embedding_raw);
    
    const prev_ref = emotion_references[prev_emotion] || `I feel ${prev_emotion}`;
    const curr_ref = emotion_references[curr_emotion] || `I feel ${curr_emotion}`;
    
    const prev_embedding_raw = await sentenceTransformer(prev_ref);
    const curr_embedding_raw = await sentenceTransformer(curr_ref);
    
    const prev_embedding = meanPooling(prev_embedding_raw);
    const curr_embedding = meanPooling(curr_embedding_raw);

    // Calculate cosine similarities
    const text_to_prev_sim = cosineSimilarity(text_embedding, prev_embedding);
    const text_to_curr_sim = cosineSimilarity(text_embedding, curr_embedding);
    const prev_to_curr_sim = cosineSimilarity(prev_embedding, curr_embedding);

    // Determine if there's a semantic flip
    const similarity_threshold = 0.5;
    const flip_threshold = 0.3;
    
    const curr_match = text_to_curr_sim > similarity_threshold;
    const prev_mismatch = text_to_prev_sim < similarity_threshold;
    const emotion_distance = 1 - prev_to_curr_sim; // How different the emotions are
    
    const similarity_diff = text_to_curr_sim - text_to_prev_sim;
    const has_flip = (curr_match && prev_mismatch) || 
                     (similarity_diff > flip_threshold && emotion_distance > 0.4);

    // Calculate confidence based on similarity differences and emotion distance
    const confidence = Math.min(0.95, Math.max(0.3, 
        (Math.abs(similarity_diff) + emotion_distance) / 2
    ));

    return {
        has_flip,
        confidence
    };
}

// Helper function to perform mean pooling on transformer embeddings, neccessary to avoid size mismatches (which gives NaN values)
function meanPooling(embeddings: any): number[] {
    if (!embeddings?.data) return [];
    
    const data = embeddings.data;
    const shape = embeddings.dims || [1, data.length / 384, 384]; // Assume 384 is embedding dim
    const [batch_size, seq_len, hidden_size] = shape;
    
    // Mean pool across sequence length dimension
    const pooled = new Array(hidden_size).fill(0);
    for (let i = 0; i < seq_len; i++) {
        for (let j = 0; j < hidden_size; j++) {
            pooled[j] += data[i * hidden_size + j];
        }
    }
    return pooled.map(val => val / seq_len);
}

//cosine simularity finder - helper function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
} 