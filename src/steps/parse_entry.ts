import { ParsedEntry } from '../types';
import { Ollama } from 'ollama';

// Initialize Ollama client
const ollama = new Ollama({
    host: 'http://localhost:11434' // Default Ollama host
});

export async function step06_parseEntry(raw_text: string): Promise<ParsedEntry> {
    try {
        // Create a comprehensive prompt for llama2 7B model
        const prompt = `Analyze this diary entry: "${raw_text}"

Extract the following information and return ONLY a valid JSON object:

{
  "theme": ["extract the most relevant themes from the text"],
  "vibe": ["extract the most relevant emotions from the text"],
  "intent": "what the person is trying to achieve or express",
  "subtext": "hidden meaning or concerns",
  "persona_trait": ["personality traits shown"],
  "bucket": ["Thought/Goal/Hobby/Value"]
}

Choose only the most relevant theme(s), vibe(s), trait(s), and bucket(s) for the input. Do not list all possible options.

Bucket Classification Rules:
- Hobby: Personal activities, entertainment, leisure
- Goal: Future plans, learning, achievements, aspirations
- Thought: Current feelings, reflections, observations
- Value: Beliefs, principles, important decisions

Examples (only two, to reduce bias):
- "I'm stressed about work deadlines" → theme: ["productivity"], vibe: ["stressed"], intent: "manage stress", bucket: ["Thought"]
- "I feel overwhelmed by all these deadlines." → theme: ["productivity"], vibe: ["overwhelmed"], intent: "take a break", bucket: ["Thought"]
- "I am so sleepy and I miss my friends" → theme: ["personal life", "relationships"], vibe: ["tired", "lonely"], intent: "rest and connect", bucket: ["Thought"]
- "I think this is a joke." → theme: ["personal life"], vibe: ["amused"], intent: "express humor", bucket: ["Thought"]

Analyze the text and return JSON:`;

        // Call Ollama llama2 7B model
        const response = await ollama.generate({
            model: 'llama2:7b',
            prompt: prompt,
            options: {
                temperature: 0.1,
                top_p: 0.9,
                num_predict: 100
            }
        });

        // Extract JSON from response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedEntry;

        // --- Post-processing: Remove 'food' from theme only if not about food ---
        const food_keywords = [
            'food', 'eat', 'eating', 'ate', 'dinner', 'lunch', 'breakfast', 'snack', 'meal', 'cuisine', 'dish', 'pizza', 'noodles', 'burger', 'pasta', 'rice', 'sushi', 'cooking', 'baking', 'kitchen', 'restaurant', 'delicious', 'tasty', 'hungry', 'appetite', 'chef', 'recipe', 'dessert', 'drink', 'beverage', 'coffee', 'tea', 'juice', 'fruit', 'vegetable', 'salad', 'sandwich', 'steak', 'chicken', 'fish', 'seafood', 'soup', 'spicy', 'sweet', 'savory', 'flavor', 'taste'
        ];
        const is_about_food = food_keywords.some(word => raw_text.toLowerCase().includes(word));
        if (Array.isArray(parsed.theme) && !is_about_food) {
            parsed.theme = parsed.theme.filter(t => t.toLowerCase() !== 'food');
        }

        // Validate and ensure required fields
        const validated: ParsedEntry = {
            theme: Array.isArray(parsed.theme) && parsed.theme.length > 0 ? parsed.theme : ["general"],
            vibe: Array.isArray(parsed.vibe) && parsed.vibe.length > 0 ? parsed.vibe : ["neutral"],
            intent: typeof parsed.intent === 'string' && parsed.intent.length > 0 ? parsed.intent : "Express thoughts and feelings",
            subtext: typeof parsed.subtext === 'string' && parsed.subtext.length > 0 ? parsed.subtext : "Surface-level expression",
            persona_trait: Array.isArray(parsed.persona_trait) && parsed.persona_trait.length > 0 ? parsed.persona_trait : ["reflective"],
            bucket: Array.isArray(parsed.bucket) && parsed.bucket.length > 0 ? parsed.bucket : ["Thought"]
        };

        console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${validated.theme.join(',')}, vibes:${validated.vibe.join(',')}" | note="[OLLAMA LLAMA2 7B] AI-powered extraction"`);
        return validated;

    } catch (error) {
        console.warn(`[PARSE_ENTRY] Ollama failed, falling back to rule-based: ${error}`);
        
        // Fallback to rule-based extraction
        return fallbackRuleBasedExtraction(raw_text);
    }
}

// Fallback rule-based extraction (original implementation)
function fallbackRuleBasedExtraction(raw_text: string): ParsedEntry {
    const text_lower = raw_text.toLowerCase();

    // --- Enhancement: Emoji and Negative Sentiment Detection ---
    // Emoji regex (covers most common emojis)
    const emoji_regex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = raw_text.match(emoji_regex) || [];

    // Negative sentiment detection
    const negative_patterns = {
        'regret': /regret|remorse|sorry|shouldn't|should not have|wish i hadn't/,
        'frustrated': /frustrated|frustrating|annoyed|irritated|fed up|can't stand/,
        'guilt': /guilt|guilty|ashamed|shame|blame myself|my fault/,
        'resentful': /resent|resentful|bitterness|bitter|envy|jealous/,
        'disappointed': /disappointed|let down|disappointing|not what i hoped/,
        'hopeless': /hopeless|despair|no way out|give up|pointless/,
        'angry': /angry|mad|furious|rage|enraged|infuriated/,
        'sad': /sad|unhappy|down|depressed|blue|tearful/
    };
    const negative_vibes = Object.entries(negative_patterns)
        .filter(([, pattern]) => pattern.test(text_lower))
        .map(([vibe]) => vibe);

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

    let vibes = Object.entries(vibe_patterns)
        .filter(([, pattern]) => pattern.test(text_lower))
        .map(([vibe]) => vibe);
    // Add negative vibes if detected and not already present
    for (const neg of negative_vibes) {
        if (!vibes.includes(neg)) vibes.push(neg);
    }
    if (vibes.length === 0) vibes = ["neutral"];

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
        vibe: vibes,
        intent,
        subtext,
        persona_trait: persona_traits.length > 0 ? persona_traits : ["reflective"],
        bucket
        // emojis: emojis // Uncomment if you want to add emojis to the ParsedEntry type
    };

    console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}, emojis:${emojis.join('')}" | note="[FALLBACK] Rule-based extraction with emoji & negative sentiment"`);
    return parsed;
} 