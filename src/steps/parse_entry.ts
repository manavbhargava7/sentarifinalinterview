import { ParsedEntry } from '../types';
import { Ollama } from 'ollama';

// Initialize Ollama client
const ollama = new Ollama({
    host: 'http://localhost:11434' // Default Ollama host
});

export async function step06_parseEntry(raw_text: string): Promise<ParsedEntry> {
    try {
        // Create a comprehensive prompt for Phi model
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
- Hobby: Personal activities, food, entertainment, leisure
- Goal: Future plans, learning, achievements, aspirations
- Thought: Current feelings, reflections, observations
- Value: Beliefs, principles, important decisions

Examples:
- "I ate noodles for dinner and was happy" → theme: ["personal life", "food"], vibe: ["happy"], intent: "enjoy food", bucket: ["Hobby"]
- "I'm stressed about work deadlines" → theme: ["productivity"], vibe: ["stressed"], intent: "manage stress", bucket: ["Thought"]
- "I want to learn coding" → theme: ["personal growth"], vibe: ["excited"], intent: "learn new skill", bucket: ["Goal"]

Analyze the text and return JSON:`;

        // Call Ollama Phi model
        const response = await ollama.generate({
            model: 'phi',
            prompt: prompt,
            options: {
                temperature: 0.1,
                top_p: 0.9,
                num_predict: 300
            }
        });

        // Extract JSON from response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedEntry;

        // Validate and ensure required fields
        const validated: ParsedEntry = {
            theme: Array.isArray(parsed.theme) && parsed.theme.length > 0 ? parsed.theme : ["general"],
            vibe: Array.isArray(parsed.vibe) && parsed.vibe.length > 0 ? parsed.vibe : ["neutral"],
            intent: typeof parsed.intent === 'string' && parsed.intent.length > 0 ? parsed.intent : "Express thoughts and feelings",
            subtext: typeof parsed.subtext === 'string' && parsed.subtext.length > 0 ? parsed.subtext : "Surface-level expression",
            persona_trait: Array.isArray(parsed.persona_trait) && parsed.persona_trait.length > 0 ? parsed.persona_trait : ["reflective"],
            bucket: Array.isArray(parsed.bucket) && parsed.bucket.length > 0 ? parsed.bucket : ["Thought"]
        };

        console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${validated.theme.join(',')}, vibes:${validated.vibe.join(',')}" | note="[OLLAMA PHI] AI-powered extraction"`);
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

    const vibes = Object.entries(vibe_patterns)
        .filter(([, pattern]) => pattern.test(text_lower))
        .map(([vibe]) => vibe);

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
        vibe: vibes.length > 0 ? vibes : ["neutral"],
        intent,
        subtext,
        persona_trait: persona_traits.length > 0 ? persona_traits : ["reflective"],
        bucket
    };

    console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}" | note="[FALLBACK] Rule-based extraction"`);
    return parsed;
} 