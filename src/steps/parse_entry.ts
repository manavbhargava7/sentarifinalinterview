import { ParsedEntry } from '../types';
import { Ollama } from 'ollama';

// Initialize Ollama client
const ollama = new Ollama({
    host: 'http://127.0.0.1:11434' // Use IP instead of localhost
});

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

export async function step06_parseEntry(raw_text: string): Promise<ParsedEntry> {
    try {
        // Generate a unique session ID to force independent processing
        const sessionId = Math.random().toString(36).substring(2, 15);

        // Simple context reset - just make a quick request to clear memory
        try {
            await withTimeout(ollama.generate({
                model: 'phi',
                prompt: `Session ${sessionId}: Reset. Clear memory. New session.`,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 3
                }
            }), 3000);
            console.log(`[PARSE_ENTRY] Context reset successful for session ${sessionId}`);
        } catch (resetError) {
            console.warn(`[PARSE_ENTRY] Context reset failed, continuing anyway: ${resetError}`);
        }

        // Create a comprehensive prompt for llama2 7B model
        const prompt = `Session ${sessionId}: Analyze this diary entry: "${raw_text}"

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
- "I am so sleepy and I miss my friends" → theme: ["personal life", "relationships"], vibe: ["tired", "lonely"], intent: "rest and connect", bucket: ["Thought"]

Analyze the text and return JSON:`;

        // Call Ollama phi model
        const response = await withTimeout(ollama.generate({
            model: 'phi',
            prompt: prompt,
            options: {
                temperature: 0.1,
                top_p: 0.9,
                num_predict: 100
            }
        }), 120000);

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

        console.log(`[PARSE_ENTRY] input="${raw_text.substring(0, 30)}..." | output="themes:${validated.theme.join(',')}, vibes:${validated.vibe.join(',')}" | note="[OLLAMA PHI] AI-powered extraction"`);
        return validated;

    } catch (error) {
        console.warn(`[PARSE_ENTRY] Ollama failed, falling back to rule-based: ${error}`);
        console.warn(`[PARSE_ENTRY] Error details:`, error);
        console.warn(`[PARSE_ENTRY] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

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
        'regret': /regret|remorse|sorry|shouldn't|should not have|wish i hadn't|wish i didn't|if only|regretting|regretted/,
        'frustrated': /frustrated|frustrating|annoyed|irritated|fed up|can't stand|cannot stand|pissed off|pissed|bothered|bugged/,
        'guilt': /guilt|guilty|ashamed|shame|blame myself|my fault|feel bad|bad about|responsible for|culpable/,
        'resentful': /resent|resentful|bitterness|bitter|envy|jealous|jealousy|envious|spite|spiteful/,
        'disappointed': /disappointed|let down|disappointing|not what i hoped|not what i expected|underwhelmed|dissatisfied|unfulfilled/,
        'hopeless': /hopeless|despair|no way out|give up|pointless|useless|meaningless|no point|no hope|helpless/,
        'angry': /angry|mad|furious|rage|enraged|infuriated|livid|outraged|fuming|heated|upset/,
        'sad': /sad|unhappy|down|depressed|blue|tearful|melancholy|gloomy|miserable|heartbroken|sorrowful/
    };
    const negative_vibes = Object.entries(negative_patterns)
        .filter(([, pattern]) => pattern.test(text_lower))
        .map(([vibe]) => vibe);

    // Theme extraction (nouns, topics)
    const theme_patterns = {
        'work-life balance': /work.life|life.work|balance|slack|overtime|rest|break|time off|vacation|holiday|weekend|personal time|family time/,
        'productivity': /productive|efficiency|efficient|focus|task|deadline|project|workload|output|performance|results|accomplish|complete/,
        'startup culture': /startup|company|team|culture|growth|scale|funding|investor|pitch|demo|product|market|competition/,
        'intern management': /intern|mentor|junior|manage|guide|teach|train|supervise|lead|coach|support|help|assist/,
        'personal growth': /learn|learning|improve|growth|skill|develop|development|progress|advance|evolve|better|enhance|master/,
        'relationships': /friend|family|relationship|partner|colleague|coworker|team|social|connection|bond|trust|support/,
        'health': /health|wellness|exercise|workout|gym|fitness|diet|nutrition|sleep|rest|energy|stress|mental health|physical/,
        'technology': /tech|technology|software|code|programming|app|website|digital|online|computer|device|tool|platform/
    };

    const themes = Object.entries(theme_patterns)
        .filter(([, pattern]) => pattern.test(text_lower))
        .map(([theme]) => theme);

    // Vibe extraction (emotions)
    const vibe_patterns = {
        'anxious': /anxious|anxiety|worried|worry|nervous|scared|stress|stressed|tense|uneasy|jittery|on edge|panicked|fearful/,
        'excited': /excited|thrilled|amazing|fantastic|awesome|wonderful|great|brilliant|incredible|stoked|pumped|energized|enthusiastic/,
        'exhausted': /exhausted|tired|drained|worn|fatigue|burned out|burnout|weary|spent|depleted|drained|overwhelmed|swamped/,
        'driven': /driven|motivated|determined|focused|ambitious|passionate|committed|dedicated|persistent|tenacious|goal-oriented/,
        'curious': /curious|wonder|interesting|explore|discover|fascinated|intrigued|interested|inquisitive|questioning|learning/,
        'overwhelmed': /overwhelmed|too much|can't handle|cannot handle|swamped|drowning|buried|snowed under|in over my head/,
        'confident': /confident|sure|certain|positive|optimistic|hopeful|assured|self-assured|capable|competent|ready/,
        'confused': /confused|uncertain|unsure|unclear|puzzled|perplexed|baffled|lost|stuck|indecisive|doubtful/,
        'grateful': /grateful|thankful|appreciate|blessed|lucky|fortunate|happy|joyful|content|satisfied|fulfilled/,
        'lonely': /lonely|alone|isolated|missing|homesick|longing|yearning|craving|wanting|needing|desperate/,
        'happy': /happy|happiness|joy|joyful|cheerful|delighted|pleased|glad|elated|ecstatic|blissful|merry|jovial|upbeat|positive|smiling|grinning|beaming|radiant|sunny/
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
        { pattern: /need.rest|want.sleep|should.relax|take.break|slow.down|pace.myself/, intent: "Find rest without guilt or fear" },
        { pattern: /improve.productivity|be more efficient|get.done|finish.task|complete.work/, intent: "Increase work efficiency" },
        { pattern: /learn.skill|want.grow|develop.ability|master.craft|become.better/, intent: "Develop new capabilities" },
        { pattern: /help.team|support.others|mentor.someone|guide.colleague|assist.coworker/, intent: "Support team members effectively" },
        { pattern: /solve.problem|figure.out|find.solution|resolve.issue|address.challenge/, intent: "Solve problems and overcome obstacles" },
        { pattern: /connect.with|build.relationship|strengthen.bond|deepen.connection/, intent: "Build meaningful relationships" },
        { pattern: /express.feelings|share.thoughts|get.off.chest|vent|talk.about/, intent: "Express thoughts and feelings openly" },
        { pattern: /plan.future|set.goal|create.vision|design.path|chart.*course/, intent: "Plan and set future direction" }
    ];

    const intent = intent_patterns.find(({ pattern }) => pattern.test(text_lower))?.intent || "Express thoughts and feelings";

    // Subtext extraction
    const subtext_patterns = [
        { pattern: /but.scared|however.worry|though.afraid|even.though.fear/, subtext: "Fear of missing out or falling behind" },
        { pattern: /don't want.seen|afraid.think|worried.others.think|concerned.perception/, subtext: "Concerns about others' perceptions" },
        { pattern: /should.more|need.better|must.improve|have.to.excel/, subtext: "Self-imposed pressure to excel" },
        { pattern: /not.good.enough|falling.behind|not.keeping.up|lagging.behind/, subtext: "Imposter syndrome or inadequacy feelings" },
        { pattern: /missing.out|fomo|everyone.else|others.are/, subtext: "Fear of missing out on opportunities" },
        { pattern: /tired.of|sick.of|fed.up.with|had.enough/, subtext: "Burnout or frustration with current situation" },
        { pattern: /wish.could|if.only|dream.of|fantasize.about/, subtext: "Longing for different circumstances" },
        { pattern: /don't.know.what.to.do|lost.direction|uncertain.path|confused.about/, subtext: "Uncertainty about future direction" }
    ];

    const subtext = subtext_patterns.find(({ pattern }) => pattern.test(text_lower))?.subtext || "Surface-level expression";

    // Persona traits
    const trait_patterns = {
        'conscientious': /check|ensure|careful|thorough|responsible|diligent|meticulous|precise|accurate|reliable/,
        'vigilant': /watch|monitor|alert|aware|notice|observe|pay.attention|keep.eye|stay.focused/,
        'organiser': /plan|organize|structure|system|method|arrange|coordinate|manage|schedule|prioritize/,
        'builder': /create|build|develop|make|construct|design|craft|form|establish|found/,
        'mentor': /teach|guide|help|support|share|coach|advise|counsel|nurture|empower/,
        'analytical': /analyze|think|reason|logic|rational|examine|study|investigate|research|explore/,
        'creative': /creative|imaginative|innovative|artistic|original|unique|inventive|visionary|inspired/,
        'empathetic': /understand|feel|empathy|compassion|kind|caring|sensitive|considerate|thoughtful/,
        'resilient': /persevere|persist|endure|overcome|bounce.back|recover|adapt|flexible|strong/,
        'collaborative': /team|collaborate|cooperate|work.together|partner|ally|unite|join.forces/
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