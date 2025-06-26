/**
 * Step 11: GPT_REPLY - FIXED VERSION
 * Generate ≤55-character empathetic response using OpenAI API or mock templates.
 */

// Types (unchanged)
interface ParsedEntry {
  theme: string[];
  vibe: string[];
  intent: string;
  subtext: string;
  persona_trait: string[];
  bucket: string[];
}

interface UserProfile {
  top_themes: string[];
  theme_count: Record<string, number>;
  dominant_vibe: string;
  vibe_count: Record<string, number>;
  bucket_count: Record<string, number>;
  trait_pool: string[];
  last_theme: string;
}

interface GptReplyResult {
  response_text: string;
  character_count: number;
  response_type: string;
  processing_time_ms: number;
  mode: string;
  cost_estimate?: number;
}

interface GptReplyConfig {
  use_mock_gpt?: boolean;
  max_characters?: number;
  enable_emojis?: boolean;
  openai_api_key?: string;
  model?: string;
  temperature?: number;
}

// OpenAI API integration
let openaiAvailable = false;

try {
  require('openai');
  openaiAvailable = true;
} catch (error) {
  console.warn('Warning: OpenAI package not installed. Using mock mode.');
}

// Logger utility
class Logger {
  static info(message: string): void {
    console.log(`INFO: ${message}`);
  }
  
  static warn(message: string): void {
    console.warn(`WARN: ${message}`);
  }
  
  static error(message: string): void {
    console.error(`ERROR: ${message}`);
  }

  static debug(message: string): void {
    console.log(`DEBUG: ${message}`);
  }
}

// Mock response templates (unchanged)
type MockTemplate = {
  first_time: string[];
  experienced: string[];
};

const MOCK_RESPONSE_TEMPLATES: Record<string, MockTemplate> = {
  anxious: {
    first_time: [
      "Take a breath—you're doing your best right now.",
      "Anxiety is hard, but you're not alone in this.",
      "One step at a time. You've got this.",
      "It's okay to feel overwhelmed sometimes.",
      "Your feelings are valid. Be gentle with yourself."
    ],
    experienced: [
      "🧩 This familiar stress—breathe through it 💙",
      "🧩 You've handled anxiety before. You can again.",
      "🧩 Same pattern, but you're stronger now 💪",
      "🧩 Notice the spiral? Time to pause 🌱",
      "🧩 Your anxious mind is active—ground yourself."
    ]
  },
  exhausted: {
    first_time: [
      "Sounds like you're drained but trying—rest is not failure.",
      "Being tired is your body asking for care.",
      "Exhaustion is real. Honor what you need.",
      "You're pushing hard. Time to recharge?",
      "Fatigue is a signal, not a weakness."
    ],
    experienced: [
      "🧩 You're still wired-in, but self-care matters too 💤",
      "🧩 Familiar burnout pattern—what do you need? 🌿",
      "🧩 Energy tank empty again? Time to refill ⚡",
      "🧩 Rest isn't optional when you're this tired.",
      "🧩 Your body's been saying this for a while 🛌"
    ]
  },
  excited: {
    first_time: [
      "Your excitement is contagious! Enjoy this energy.",
      "Love seeing you energized about something new!",
      "This enthusiasm is beautiful. Ride the wave!",
      "Excitement like this is fuel for great things.",
      "Your joy is lighting up the room right now!"
    ],
    experienced: [
      "🧩 That familiar spark is back! Channel it well ✨",
      "🧩 You're in your element again—love to see it! 🔥",
      "🧩 This energy pattern—where will you direct it? 🎯",
      "🧩 Excitement level: recognized! Go create! 🚀",
      "🧩 Your enthusiasm cycle is powerful. Use it! 💫"
    ]
  },
  default: {
    first_time: [
      "You're doing your best. That's what matters.",
      "All of your feelings matter and make sense.",
      "Take your time. You're exactly where you need to be.",
      "Your journey is unique and valid.",
      "Being human is complicated. You're handling it well."
    ],
    experienced: [
      "🧩 You know yourself well. Trust your process.",
      "🧩 This feeling is familiar. What usually helps?",
      "🧩 You've navigated this before successfully.",
      "🧩 Your patterns are becoming clearer over time.",
      "🧩 Trust your experience. You've got wisdom now."
    ]
  }
};

class GptReplyGenerator {
  private maxCharacters: number;
  private useMockGpt: boolean;
  private enableEmojis: boolean;
  private openaiClient: any;
  private model: string;
  private temperature: number;

  constructor(config: GptReplyConfig = {}) {
    this.maxCharacters = config.max_characters || 55;
    this.model = config.model || 'gpt-3.5-turbo';
    this.temperature = config.temperature || 0.7;
    this.enableEmojis = config.enable_emojis !== false;
    
    // FIXED: Better logic for determining mock vs real mode
    const useRealGpt = process.env.USE_REAL_GPT?.toLowerCase() === 'true';
    const hasApiKey = !!(config.openai_api_key || process.env.OPENAI_API_KEY);
    
    Logger.debug(`Config analysis: use_mock_gpt=${config.use_mock_gpt}, useRealGpt=${useRealGpt}, hasApiKey=${hasApiKey}, openaiAvailable=${openaiAvailable}`);
    
    // Determine mock mode with clearer logic
    if (config.use_mock_gpt === true) {
      this.useMockGpt = true;
      Logger.debug("Using mock mode: explicitly requested");
    } else if (config.use_mock_gpt === false) {
      this.useMockGpt = false;
      Logger.debug("Using real mode: explicitly requested");
    } else {
      // Auto-detect mode
      this.useMockGpt = !useRealGpt || !hasApiKey || !openaiAvailable;
      Logger.debug(`Using auto-detected mode: mock=${this.useMockGpt}`);
    }
    
    // FIXED: Initialize OpenAI client with better error handling
    this.openaiClient = null;
    if (!this.useMockGpt) {
      this.initializeOpenAIClient(config);
    }
    
    Logger.debug(`Final configuration: useMockGpt=${this.useMockGpt}, hasClient=${!!this.openaiClient}`);
  }

  private initializeOpenAIClient(config: GptReplyConfig): void {
    const apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      Logger.warn('No OpenAI API key found, falling back to mock mode');
      this.useMockGpt = true;
      return;
    }

    if (!openaiAvailable) {
      Logger.warn('OpenAI package not available, falling back to mock mode');
      this.useMockGpt = true;
      return;
    }

    try {
      const OpenAI = require('openai');
      this.openaiClient = new OpenAI({ apiKey });
      Logger.debug(`OpenAI client initialized successfully with model: ${this.model}`);
    } catch (error) {
      Logger.error(`Failed to initialize OpenAI client: ${error}`);
      this.useMockGpt = true;
      this.openaiClient = null;
    }
  }
  
  private buildGptPrompt(
    parsedEntry: ParsedEntry,
    userProfile: UserProfile,
    isFirstTime: boolean,
    carryIn: boolean
  ): string {
    const userContext = isFirstTime 
      ? "This is their first diary entry" 
      : `This is their ${Object.values(userProfile.theme_count).reduce((a, b) => a + b, 0) + 1}th entry. Their dominant vibe is "${userProfile.dominant_vibe}" and top themes are: ${userProfile.top_themes.slice(0, 3).join(', ')}.`;
    
    const patternContext = carryIn 
      ? " This emotional pattern is recurring - they've felt similar recently."
      : " This seems like a new emotional experience for them.";
    
    const emojiInstruction = this.enableEmojis && !isFirstTime 
      ? " For recurring patterns, start with 🧩 emoji to indicate pattern recognition."
      : " Do not use emojis.";

    return `You are an empathetic AI companion responding to someone's diary entry. 

ENTRY ANALYSIS:
- Themes: ${parsedEntry.theme.join(', ')}
- Current emotional tone: ${parsedEntry.vibe.join(', ')}
- Their intent: ${parsedEntry.intent}
- Underlying concern: ${parsedEntry.subtext}
- Personality traits: ${parsedEntry.persona_trait.join(', ')}

USER CONTEXT:
${userContext}${patternContext}

RESPONSE REQUIREMENTS:
- Maximum ${this.maxCharacters} characters (strictly enforced)
- Empathetic and supportive tone
- Acknowledge their current emotional state
- Validate their experience
- Brief but meaningful${emojiInstruction}

Generate a caring response that shows you understand their emotional state and provides gentle support:`;
  }

  private async callOpenAI(prompt: string): Promise<{ response: string; cost: number }> {
    try {
      Logger.debug(`Calling OpenAI API with model: ${this.model}`);
      
      const completion = await this.openaiClient.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.ceil(this.maxCharacters * 1.2),
        temperature: this.temperature,
      });

      const response = completion.choices[0]?.message?.content?.trim() || '';
      
      // Cost estimation
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(response.length / 4);
      const costPer1KTokens = this.model.includes('gpt-4') ? 0.03 : 0.002;
      const cost = ((inputTokens + outputTokens) / 1000) * costPer1KTokens;

      Logger.debug(`OpenAI API response: "${response}" (${response.length} chars, $${cost.toFixed(4)})`);
      
      return { response, cost };
    } catch (error) {
      Logger.error(`OpenAI API call failed: ${error}`);
      throw error;
    }
  }

  private selectMockTemplate(parsedEntry: ParsedEntry, isFirstTime: boolean): string {
    const primaryVibe = this.detectPrimaryVibe(parsedEntry.vibe);
    const templates = MOCK_RESPONSE_TEMPLATES[primaryVibe] || MOCK_RESPONSE_TEMPLATES.default;
    const templateList = isFirstTime ? templates.first_time : templates.experienced;
    
    const index = Math.abs(parsedEntry.intent.length + parsedEntry.theme.join('').length) % templateList.length;
    return templateList[index];
  }

  private detectPrimaryVibe(vibes: string[]): string {
    if (!vibes || vibes.length === 0) return 'default';
    
    const vibePriority = ['exhausted', 'anxious', 'excited'];
    for (const priorityVibe of vibePriority) {
      for (const vibe of vibes) {
        if (vibe.toLowerCase().includes(priorityVibe)) {
          return priorityVibe;
        }
      }
    }
    
    return vibes[0].toLowerCase();
  }

  private enforceCharacterLimit(text: string): string {
    if (text.length <= this.maxCharacters) return text;
    
    const truncated = text.substring(0, this.maxCharacters);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > this.maxCharacters * 0.8) {
      return truncated.substring(0, lastSpace);
    }
    
    return text.substring(0, this.maxCharacters - 1) + '…';
  }

  private isFirstTimeUser(profile: UserProfile): boolean {
    const totalEntries = Object.values(profile.theme_count).reduce((sum, count) => sum + count, 0);
    return totalEntries <= 1;
  }

  async generateReply(
    parsedEntry: ParsedEntry,
    userProfile: UserProfile,
    carryIn: boolean = false
  ): Promise<[string, number, string, number?]> {
    const startTime = Date.now();
    const isFirstTime = this.isFirstTimeUser(userProfile);
    
    let responseText: string;
    let modeNote: string;
    let cost: number | undefined;

    Logger.debug(`Generating reply: useMockGpt=${this.useMockGpt}, hasClient=${!!this.openaiClient}`);

    try {
      if (this.useMockGpt || !this.openaiClient) {
        // Mock mode
        responseText = this.selectMockTemplate(parsedEntry, isFirstTime);
        modeNote = '[MOCK-GPT]';
        cost = 0.0;
        Logger.debug(`Using mock template: "${responseText}"`);
      } else {
        // Real OpenAI mode
        Logger.debug('Using real OpenAI API');
        const prompt = this.buildGptPrompt(parsedEntry, userProfile, isFirstTime, carryIn);
        const result = await this.callOpenAI(prompt);
        responseText = result.response;
        cost = result.cost;
        modeNote = `[REAL-GPT-${this.model}]`;
      }

      responseText = this.enforceCharacterLimit(responseText);
      const processingTime = Date.now() - startTime;
      
      return [responseText, processingTime, modeNote, cost];
      
    } catch (error) {
      Logger.error(`GPT reply generation failed: ${error}`);
      
      // Fallback to mock
      responseText = this.selectMockTemplate(parsedEntry, isFirstTime);
      const processingTime = Date.now() - startTime;
      return [responseText, processingTime, '[MOCK-FALLBACK]', 0.0];
    }
  }
}

// FIXED: Remove global generator to ensure fresh instances with correct config
function getGptReplyGenerator(config: GptReplyConfig = {}): GptReplyGenerator {
  return new GptReplyGenerator(config);
}

export async function gptReplyStep(
  parsedEntry: ParsedEntry,
  userProfile: UserProfile,
  carryIn: boolean = false,
  config: GptReplyConfig = {}
): Promise<GptReplyResult> {
  if (!parsedEntry || !userProfile) {
    throw new Error('parsedEntry and userProfile are required');
  }

  // Get fresh generator instance with config
  const generator = getGptReplyGenerator(config);

  const [responseText, processingTime, modeNote, cost] = await generator.generateReply(
    parsedEntry,
    userProfile,
    carryIn
  );

  const result: GptReplyResult = {
    response_text: responseText,
    character_count: responseText.length,
    response_type: carryIn ? 'pattern_recognition' : 'first_time',
    processing_time_ms: Math.round(processingTime * 100) / 100,
    mode: modeNote,
    cost_estimate: cost
  };

  // Log in required format
  const vibePreview = parsedEntry.vibe.join(', ');
  const themePreview = parsedEntry.theme.join(', ');
  const inputSummary = `vibe=[${vibePreview}], theme=[${themePreview}], carry_in=${carryIn}`;
  const outputSummary = `response_text="${responseText}"`;
  const costNote = cost !== undefined ? ` ($${cost.toFixed(4)})` : '';
  const note = `${modeNote} Generated ${result.character_count}-char response in ${result.processing_time_ms}ms${costNote}`;

  Logger.info(`[GPT_REPLY] input=<${inputSummary}> | output=<${outputSummary}> | note=<${note}>`);

  return result;
}

export async function processStep11(
  parsedEntry: ParsedEntry,
  userProfile: UserProfile,
  carryIn: boolean = false,
  config: GptReplyConfig = {}
): Promise<GptReplyResult> {
  return await gptReplyStep(parsedEntry, userProfile, carryIn, config);
}

// Example usage and testing
async function main(): Promise<void> {
  console.log('🤖 Testing GPT Reply Generation...');
  console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Not found (using mock)');
  console.log('🔧 USE_REAL_GPT:', process.env.USE_REAL_GPT || 'not set');
  console.log('-'.repeat(60));

  const testParsedEntry: ParsedEntry = {
    theme: ["work-life balance"],
    vibe: ["anxious", "exhausted"],
    intent: "Find rest without guilt or fear of missing out.",
    subtext: "Fears being seen as less committed.",
    persona_trait: ["conscientious", "vigilant"],
    bucket: ["Thought"]
  };

  const firstTimeProfile: UserProfile = {
    top_themes: [],
    theme_count: {},
    dominant_vibe: '',
    vibe_count: {},
    bucket_count: {},
    trait_pool: [],
    last_theme: ''
  };

  const experiencedProfile: UserProfile = {
    top_themes: ["work-life balance", "productivity", "stress management"],
    theme_count: { "work-life balance": 29, "productivity": 22, "stress management": 15 },
    dominant_vibe: "driven",
    vibe_count: { "driven": 31, "anxious": 20, "exhausted": 18, "confident": 14 },
    bucket_count: { "Thought": 46, "Goal": 32, "Value": 15 },
    trait_pool: ["conscientious", "vigilant", "perfectionist"],
    last_theme: "work-life balance"
  };

  console.log('\n🧪 Test 1: First-time user - Explicit Mock Mode');
  const result1 = await gptReplyStep(testParsedEntry, firstTimeProfile, false, { use_mock_gpt: true });
  console.log(`✅ Response: "${result1.response_text}"`);
  console.log(`🔧 Mode: ${result1.mode}`);

  console.log('\n🧪 Test 2: Experienced user - Explicit Mock Mode');
  const result2 = await gptReplyStep(testParsedEntry, experiencedProfile, true, { use_mock_gpt: true });
  console.log(`✅ Response: "${result2.response_text}"`);
  console.log(`🔧 Mode: ${result2.mode}`);

  console.log('\n🧪 Test 3: First-time user - Explicit Real Mode');
  const result3 = await gptReplyStep(testParsedEntry, firstTimeProfile, false, { use_mock_gpt: false });
  console.log(`✅ Response: "${result3.response_text}"`);
  console.log(`🔧 Mode: ${result3.mode}`);
  console.log(`💰 Cost: $${result3.cost_estimate?.toFixed(4) || '0.0000'}`);

  console.log('\n🧪 Test 4: Experienced user - Explicit Real Mode');
  const result4 = await gptReplyStep(testParsedEntry, experiencedProfile, true, { use_mock_gpt: false });
  console.log(`✅ Response: "${result4.response_text}"`);
  console.log(`🔧 Mode: ${result4.mode}`);
  console.log(`💰 Cost: $${result4.cost_estimate?.toFixed(4) || '0.0000'}`);
}

if (require.main === module) {
  main().catch(console.error);
}

// Export for pipeline integration
export async function step11_gptReply(
  parsedEntry: ParsedEntry,
  userProfile: UserProfile,
  carryIn: boolean,
  emotionFlip?: boolean
): Promise<string> {
  const result = await gptReplyStep(parsedEntry, userProfile, carryIn);
  return result.response_text;
}