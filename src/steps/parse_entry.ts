import { ParsedEntry } from '../types';

export function step06_parseEntry(raw_text: string): ParsedEntry {
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

    console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${parsed.theme.join(',')}, vibes:${parsed.vibe.join(',')}" | note="[MOCK] Rule-based extraction"`);
    return parsed;
} 