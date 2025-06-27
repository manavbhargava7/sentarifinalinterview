import { UserProfile, ContrastResult } from '../types';

let sentenceTransformer: any = null;

// NLP-enhanced emotion flip detection using sentence-transformers
export async function step08_contrastCheck(current_vibes: string[], profile: UserProfile, raw_text: string): Promise<ContrastResult> {
    const previous_dominant = profile.dominant_vibe || "";
    const current_dominant = current_vibes[0] || "neutral";

    // Comprehensive rule-based emotion opposites mapping (fallback in case NLP doesn't work)
    const opposites: Record<string, string[]> = {
        // High energy vs Low energy
        'excited': ['exhausted', 'drained', 'lethargic', 'tired', 'weary', 'depleted', 'bored', 'apathetic', 'listless'],
        'energetic': ['exhausted', 'drained', 'lethargic', 'tired', 'weary', 'depleted', 'sluggish', 'fatigued'],
        'enthusiastic': ['apathetic', 'indifferent', 'disinterested', 'unmotivated', 'bored', 'listless'],
        'vibrant': ['dull', 'lifeless', 'monotonous', 'dreary', 'stagnant'],
        'invigorated': ['exhausted', 'drained', 'depleted', 'worn-out'],

        // Positive vs Negative emotions
        'happy': ['sad', 'depressed', 'melancholy', 'miserable', 'heartbroken', 'sorrowful', 'gloomy', 'dejected'],
        'joyful': ['sorrowful', 'mournful', 'grieving', 'despondent', 'woeful'],
        'cheerful': ['gloomy', 'somber', 'morose', 'sullen', 'melancholy'],
        'elated': ['devastated', 'crushed', 'heartbroken', 'despairing'],
        'euphoric': ['depressed', 'despondent', 'hopeless', 'despairing'],
        'blissful': ['tormented', 'anguished', 'troubled', 'distressed'],
        'delighted': ['disappointed', 'displeased', 'dissatisfied', 'dismayed'],
        'content': ['restless', 'dissatisfied', 'discontented', 'unsettled', 'agitated'],
        'satisfied': ['frustrated', 'dissatisfied', 'unfulfilled', 'discontented'],
        'pleased': ['displeased', 'annoyed', 'irritated', 'vexed'],

        // Anxiety vs Calm
        'anxious': ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed', 'composed', 'centered', 'balanced'],
        'worried': ['carefree', 'untroubled', 'at-ease', 'secure', 'confident'],
        'nervous': ['composed', 'steady', 'collected', 'poised', 'self-assured'],
        'stressed': ['relaxed', 'peaceful', 'calm', 'unstressed', 'at-ease'],
        'panicked': ['composed', 'controlled', 'steady', 'collected'],
        'frantic': ['calm', 'composed', 'methodical', 'systematic'],
        'tense': ['relaxed', 'loose', 'flexible', 'at-ease'],
        'uneasy': ['comfortable', 'at-ease', 'secure', 'settled'],

        // Confidence vs Insecurity
        'confident': ['insecure', 'uncertain', 'doubtful', 'hesitant', 'timid', 'self-doubting', 'unsure'],
        'self-assured': ['insecure', 'self-doubting', 'uncertain', 'hesitant'],
        'bold': ['timid', 'shy', 'meek', 'hesitant', 'cautious'],
        'assertive': ['passive', 'submissive', 'meek', 'timid'],
        'empowered': ['powerless', 'helpless', 'defeated', 'overwhelmed'],
        'strong': ['weak', 'fragile', 'vulnerable', 'powerless'],

        // Motivation vs Apathy
        'driven': ['apathetic', 'unmotivated', 'directionless', 'aimless', 'lethargic', 'indifferent'],
        'motivated': ['unmotivated', 'uninspired', 'listless', 'indifferent'],
        'determined': ['undecided', 'wavering', 'hesitant', 'irresolute'],
        'ambitious': ['complacent', 'unambitious', 'content', 'settled'],
        'focused': ['distracted', 'scattered', 'unfocused', 'disorganized'],
        'purposeful': ['aimless', 'directionless', 'wandering', 'lost'],

        // Interest vs Boredom
        'curious': ['bored', 'disinterested', 'indifferent', 'uninterested', 'apathetic'],
        'fascinated': ['bored', 'unimpressed', 'indifferent', 'disinterested'],
        'engaged': ['disengaged', 'detached', 'withdrawn', 'disconnected'],
        'absorbed': ['distracted', 'disengaged', 'inattentive', 'preoccupied'],
        'intrigued': ['bored', 'uninterested', 'indifferent', 'dismissive'],

        // Anger vs Peace
        'angry': ['peaceful', 'calm', 'serene', 'forgiving', 'understanding'],
        'furious': ['calm', 'composed', 'peaceful', 'tranquil'],
        'irritated': ['pleased', 'content', 'satisfied', 'comfortable'],
        'frustrated': ['satisfied', 'fulfilled', 'content', 'accomplished'],
        'annoyed': ['pleased', 'delighted', 'amused', 'entertained'],
        'enraged': ['peaceful', 'calm', 'serene', 'composed'],
        'livid': ['calm', 'collected', 'composed', 'peaceful'],
        'irate': ['pleasant', 'agreeable', 'good-natured', 'amiable'],

        // Fear vs Courage
        'afraid': ['brave', 'courageous', 'fearless', 'bold', 'confident'],
        'scared': ['brave', 'fearless', 'confident', 'secure'],
        'terrified': ['fearless', 'brave', 'confident', 'secure'],
        'frightened': ['brave', 'confident', 'assured', 'secure'],
        'fearful': ['fearless', 'brave', 'confident', 'bold'],

        // Hope vs Despair
        'hopeful': ['hopeless', 'despairing', 'pessimistic', 'defeatist'],
        'optimistic': ['pessimistic', 'negative', 'cynical', 'defeatist'],
        'encouraged': ['discouraged', 'disheartened', 'demoralized', 'deflated'],
        'inspired': ['uninspired', 'discouraged', 'deflated', 'demoralized'],

        // Social vs Isolation
        'connected': ['isolated', 'lonely', 'disconnected', 'alienated'],
        'loved': ['unloved', 'rejected', 'abandoned', 'isolated'],
        'supported': ['unsupported', 'alone', 'abandoned', 'isolated'],
        'included': ['excluded', 'left-out', 'isolated', 'marginalized'],

        // Control vs Chaos
        'organized': ['chaotic', 'disorganized', 'scattered', 'messy'],
        'controlled': ['chaotic', 'wild', 'uncontrolled', 'frenzied'],
        'structured': ['unstructured', 'chaotic', 'random', 'disorganized'],
        'systematic': ['random', 'haphazard', 'chaotic', 'disorderly'],

        // Opposite mappings (reverse direction)
        'exhausted': ['excited', 'energetic', 'invigorated', 'vibrant', 'enthusiastic'],
        'drained': ['energized', 'recharged', 'invigorated', 'refreshed'],
        'tired': ['energetic', 'refreshed', 'invigorated', 'alert'],
        'lethargic': ['energetic', 'active', 'dynamic', 'vigorous'],
        'depleted': ['replenished', 'renewed', 'recharged', 'restored'],

        'sad': ['happy', 'joyful', 'cheerful', 'elated', 'delighted'],
        'depressed': ['happy', 'elated', 'euphoric', 'joyful'],
        'melancholy': ['cheerful', 'upbeat', 'bright', 'sunny'],
        'miserable': ['happy', 'content', 'satisfied', 'pleased'],
        'heartbroken': ['elated', 'overjoyed', 'ecstatic', 'blissful'],

        'calm': ['anxious', 'agitated', 'restless', 'frantic', 'panicked'],
        'peaceful': ['agitated', 'turbulent', 'chaotic', 'frantic'],
        'serene': ['agitated', 'disturbed', 'troubled', 'turbulent'],
        'tranquil': ['agitated', 'restless', 'turbulent', 'chaotic'],
        'relaxed': ['tense', 'stressed', 'anxious', 'uptight'],

        'insecure': ['confident', 'self-assured', 'certain', 'bold'],
        'uncertain': ['confident', 'sure', 'certain', 'decisive'],
        'doubtful': ['confident', 'certain', 'sure', 'convinced'],
        'hesitant': ['confident', 'decisive', 'bold', 'assertive'],
        'timid': ['bold', 'confident', 'assertive', 'brave'],

        'apathetic': ['passionate', 'enthusiastic', 'engaged', 'motivated'],
        'unmotivated': ['motivated', 'driven', 'inspired', 'energetic'],
        'indifferent': ['passionate', 'caring', 'interested', 'engaged'],
        'listless': ['energetic', 'motivated', 'engaged', 'active'],

        'bored': ['excited', 'engaged', 'fascinated', 'intrigued'],
        'disinterested': ['interested', 'engaged', 'curious', 'fascinated'],
        'uninterested': ['interested', 'curious', 'engaged', 'fascinated'],

        'overwhelmed': ['calm', 'controlled', 'organized', 'manageable', 'confident'],
        'agitated': ['calm', 'peaceful', 'serene', 'composed'],
        'restless': ['calm', 'settled', 'peaceful', 'content'],
        'chaotic': ['organized', 'structured', 'systematic', 'controlled'],

        // Additional common emotions
        'neutral': ['passionate', 'intense', 'extreme', 'fervent'],
        'empty': ['fulfilled', 'complete', 'satisfied', 'whole'],
        'lost': ['found', 'oriented', 'directed', 'purposeful'],
        'trapped': ['free', 'liberated', 'unbound', 'unrestricted'],
        'rejected': ['accepted', 'welcomed', 'embraced', 'loved'],
        'abandoned': ['supported', 'accompanied', 'cherished', 'valued'],
        'guilty': ['innocent', 'guilt-free', 'clear', 'absolved'],
        'ashamed': ['proud', 'confident', 'self-assured', 'dignified'],
        'embarrassed': ['confident', 'proud', 'self-assured', 'comfortable'],
        'jealous': ['content', 'secure', 'trusting', 'confident'],
        'envious': ['content', 'satisfied', 'grateful', 'appreciative'],
        'resentful': ['forgiving', 'understanding', 'accepting', 'peaceful'],
        'bitter': ['sweet', 'forgiving', 'understanding', 'kind'],
        'vindictive': ['forgiving', 'merciful', 'understanding', 'compassionate'],
        'spiteful': ['kind', 'generous', 'forgiving', 'compassionate']

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

    // Comprehensive emotion reference texts for semantic comparison
    const emotion_references: Record<string, string> = {
        // High energy emotions
        'excited': 'I feel excited, energetic, and enthusiastic about everything',
        'energetic': 'I feel full of energy, vibrant, and ready to take action',
        'enthusiastic': 'I am passionate, eager, and full of enthusiasm',
        'vibrant': 'I feel alive, dynamic, and full of vitality',
        'invigorated': 'I feel refreshed, energized, and renewed',

        // Positive emotions
        'happy': 'I feel joyful, content, and pleased with how things are',
        'joyful': 'I am filled with joy, happiness, and delight',
        'cheerful': 'I feel bright, upbeat, and optimistic',
        'elated': 'I am overjoyed, thrilled, and on top of the world',
        'euphoric': 'I feel an intense happiness and excitement',
        'blissful': 'I am in a state of perfect happiness and peace',
        'delighted': 'I feel pleased, happy, and satisfied',
        'content': 'I feel satisfied, peaceful, and at ease with life',
        'satisfied': 'I feel fulfilled, accomplished, and pleased',
        'pleased': 'I feel happy, satisfied, and content',

        // Calm emotions
        'calm': 'I feel peaceful, relaxed, and serene',
        'peaceful': 'I am in a state of tranquility and inner peace',
        'serene': 'I feel calm, peaceful, and undisturbed',
        'tranquil': 'I am in a state of calmness and quietude',
        'relaxed': 'I feel at ease, comfortable, and stress-free',

        // Confident emotions
        'confident': 'I feel sure, self-assured, and capable of handling things',
        'self-assured': 'I am confident in myself and my abilities',
        'bold': 'I feel brave, confident, and willing to take risks',
        'assertive': 'I am confident and direct in expressing myself',
        'empowered': 'I feel strong, capable, and in control',
        'strong': 'I feel powerful, resilient, and capable',

        // Motivated emotions
        'driven': 'I am motivated, determined, and focused on achieving my goals',
        'motivated': 'I feel inspired, energized, and ready to act',
        'determined': 'I am resolute, persistent, and committed',
        'ambitious': 'I feel driven to achieve and succeed',
        'focused': 'I am concentrated, attentive, and clear-minded',
        'purposeful': 'I feel directed, intentional, and goal-oriented',

        // Interested emotions
        'curious': 'I am interested, intrigued, and want to learn more',
        'fascinated': 'I am captivated, intrigued, and deeply interested',
        'engaged': 'I feel involved, active, and participating',
        'absorbed': 'I am completely focused and immersed',
        'intrigued': 'I feel curious, interested, and wanting to know more',

        // Negative/Low energy emotions
        'exhausted': 'I am tired, drained, and completely worn out',
        'drained': 'I feel depleted, emptied, and without energy',
        'tired': 'I feel weary, fatigued, and need rest',
        'lethargic': 'I feel sluggish, slow, and lacking energy',
        'depleted': 'I feel empty, drained, and used up',

        'sad': 'I feel down, unhappy, and melancholy about things',
        'depressed': 'I feel deeply sad, hopeless, and dejected',
        'melancholy': 'I feel sad, reflective, and somewhat sorrowful',
        'miserable': 'I feel extremely unhappy and distressed',
        'heartbroken': 'I feel devastated, crushed, and deeply hurt',

        // Anxious emotions
        'anxious': 'I feel worried, nervous, and stressed about things',
        'worried': 'I feel concerned, troubled, and uneasy',
        'nervous': 'I feel tense, jittery, and on edge',
        'stressed': 'I feel pressured, overwhelmed, and tense',
        'panicked': 'I feel intense fear and overwhelming anxiety',
        'frantic': 'I feel desperately urgent and out of control',
        'tense': 'I feel tight, strained, and on edge',
        'uneasy': 'I feel uncomfortable, troubled, and restless',

        // Insecure emotions
        'insecure': 'I feel uncertain, self-doubting, and lacking confidence',
        'uncertain': 'I feel unsure, doubtful, and hesitant',
        'doubtful': 'I feel skeptical, uncertain, and questioning',
        'hesitant': 'I feel unsure, reluctant, and indecisive',
        'timid': 'I feel shy, fearful, and lacking confidence',

        // Apathetic emotions
        'apathetic': 'I feel indifferent, unmotivated, and emotionally flat',
        'unmotivated': 'I feel lacking drive, inspiration, and energy',
        'indifferent': 'I feel uncaring, detached, and uninterested',
        'listless': 'I feel lacking energy, enthusiasm, and motivation',

        'bored': 'I feel uninterested, restless, and lacking stimulation',
        'disinterested': 'I feel unengaged, detached, and uncaring',
        'uninterested': 'I feel lacking curiosity and engagement',

        'overwhelmed': 'I feel swamped, stressed, and unable to cope with everything',
        'agitated': 'I feel restless, irritated, and unable to stay calm',
        'restless': 'I feel unable to rest, fidgety, and unsettled',
        'chaotic': 'I feel disordered, confused, and out of control',

        // Anger emotions
        'angry': 'I feel mad, irritated, and filled with anger',
        'furious': 'I feel intense anger and rage',
        'irritated': 'I feel annoyed, bothered, and impatient',
        'frustrated': 'I am annoyed, irritated, and fed up with the situation',
        'annoyed': 'I feel bothered, irritated, and impatient',

        // Fear emotions
        'afraid': 'I feel scared, frightened, and fearful',
        'scared': 'I feel frightened, afraid, and anxious',
        'terrified': 'I feel extremely frightened and panicked',
        'frightened': 'I feel scared, afraid, and alarmed',
        'fearful': 'I feel afraid, worried, and apprehensive',

        // Hope emotions
        'hopeful': 'I feel optimistic, positive, and expectant',
        'optimistic': 'I feel positive, hopeful, and confident about the future',
        'encouraged': 'I feel hopeful, inspired, and uplifted',
        'inspired': 'I feel motivated, uplifted, and filled with ideas',

        // Social emotions
        'connected': 'I feel linked, bonded, and close to others',
        'loved': 'I feel cherished, valued, and cared for',
        'supported': 'I feel backed, helped, and encouraged by others',
        'included': 'I feel welcomed, accepted, and part of the group',

        // Control emotions
        'organized': 'I feel structured, orderly, and in control',
        'controlled': 'I feel disciplined, restrained, and in charge',
        'structured': 'I feel organized, systematic, and orderly',
        'systematic': 'I feel methodical, organized, and efficient',

        // Additional emotions
        'neutral': 'I feel neither positive nor negative, just balanced',
        'empty': 'I feel hollow, vacant, and lacking substance',
        'lost': 'I feel confused, directionless, and without purpose',
        'trapped': 'I feel confined, stuck, and unable to escape',
        'rejected': 'I feel refused, dismissed, and unwanted',
        'abandoned': 'I feel left alone, deserted, and forsaken',
        'guilty': 'I feel responsible for wrongdoing and regretful',
        'ashamed': 'I feel embarrassed, humiliated, and unworthy',
        'embarrassed': 'I feel awkward, self-conscious, and uncomfortable',
        'jealous': 'I feel envious, possessive, and resentful',
        'envious': 'I feel jealous and wanting what others have',
        'resentful': 'I feel bitter, angry, and holding grudges',
        'bitter': 'I feel resentful, angry, and cynical',
        'vindictive': 'I feel revengeful, spiteful, and seeking retribution',
        'spiteful': 'I feel malicious, vindictive, and wanting to hurt'
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