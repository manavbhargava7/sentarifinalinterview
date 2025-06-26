import { DiaryEntry, ParsedEntry, MetaData, UserProfile } from './types';
import fs from 'fs';
import path from 'path';

export class MockDataGenerator {
  private static readonly SAMPLE_TRANSCRIPTS = [
    "I spent the morning mentoring our new intern on React patterns. They're picking it up quickly but I worry about overwhelming them with too much at once.",
    "Feeling really driven today! Shipped three features and the team momentum is incredible. Startup life is exhausting but so rewarding.",
    "Had a difficult conversation with the founder about our company culture. Sometimes I wonder if we're moving too fast and losing our values.",
    "Working late again trying to hit this deadline. I know I should prioritize work-life balance but this project feels critical.",
    "The new productivity system I implemented is finally paying off. The team seems more focused and our sprint velocity increased.",
    "Feeling overwhelmed by all the intern applications. How do I choose fairly when everyone seems so talented?",
    "Curious about this new AI tool everyone's talking about. Might be worth exploring for our automation needs.",
    "Exhausted from the all-hands meeting. So many conflicting priorities and not enough time to execute everything properly",
    "Excited about the startup accelerator program we got accepted into! This could be the breakthrough moment we've been waiting for.",
    "Struggling with imposter syndrome again. Everyone seems so confident while I'm questioning every decision I make."
  ];

  private static readonly THEMES = [
    "intern management", "startup culture", "productivity", "work-life balance", 
    "personal growth", "team dynamics", "leadership", "technology"
  ];

  private static readonly VIBES = [
    "driven", "curious", "overwhelmed", "excited", "anxious", "exhausted", "confident"
  ];

  private static readonly TRAITS = [
    "organiser", "builder", "mentor", "conscientious", "vigilant", "empathetic"
  ];

  private static readonly BUCKETS = ["Goal", "Thought", "Hobby", "Value"];

  public static generateMockEntries(count: number): DiaryEntry[] {
    const filePath = path.join(__dirname, 'test_diary_entries.json');
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const allEntries: DiaryEntry[] = JSON.parse(fileContents);
  
    return allEntries.slice(0, count);
  }

  public static generateMockEntries_old(count: number): DiaryEntry[] {
    const entries: DiaryEntry[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const transcript = this.SAMPLE_TRANSCRIPTS[i % this.SAMPLE_TRANSCRIPTS.length];
      const baseDate = new Date(now.getTime() - (count - i) * 24 * 60 * 60 * 1000); // Past entries
      
      entries.push(this.createMockEntry(transcript, baseDate, i));
    }

    return entries;
  }

  private static createMockEntry(transcript: string, timestamp: Date, index: number): DiaryEntry {
    const themes = this.sampleArray(this.THEMES, 1, 3);
    const vibes = this.sampleArray(this.VIBES, 1, 2);
    const traits = this.sampleArray(this.TRAITS, 1, 3);
    const buckets = this.sampleArray(this.BUCKETS, 1, 1);

    const parsed: ParsedEntry = {
      theme: themes,
      vibe: vibes,
      intent: this.generateIntent(transcript),
      subtext: this.generateSubtext(transcript),
      persona_trait: traits,
      bucket: buckets
    };

    const words = transcript.split(/\s+/);
    const meta_data: MetaData = {
      word_count: words.length,
      top_words: words.slice(0, 5).map(w => w.toLowerCase()),
      punctuation_flags: {
        has_exclamation: transcript.includes('!'),
        has_question: transcript.includes('?'),
        has_ellipsis: transcript.includes('...')
      }
    };

    return {
      id: `mock_entry_${index}_${timestamp.getTime()}`,
      raw_text: transcript,
      embedding: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
      parsed,
      meta_data,
      timestamp
    };
  }

  private static sampleArray<T>(arr: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static generateIntent(transcript: string): string {
    const intents = [
      "Improve team leadership skills",
      "Balance work demands with personal well-being",
      "Build better startup culture",
      "Enhance productivity systems",
      "Support team members effectively",
      "Navigate complex business decisions",
      "Develop technical expertise",
      "Foster inclusive workplace environment"
    ];
    return intents[Math.floor(Math.random() * intents.length)];
  }

  private static generateSubtext(transcript: string): string {
    const subtexts = [
      "Desires recognition as a capable leader",
      "Fears falling behind in fast-paced environment",
      "Seeks validation from team and founders",
      "Worries about making wrong decisions",
      "Wants to be seen as indispensable",
      "Struggles with perfectionist tendencies",
      "Questions personal abilities and expertise",
      "Balances ambition with self-care needs"
    ];
    return subtexts[Math.floor(Math.random() * subtexts.length)];
  }

  public static generateMockProfile(entries: DiaryEntry[]): UserProfile {
    const theme_count: Record<string, number> = {};
    const vibe_count: Record<string, number> = {};
    const bucket_count: Record<string, number> = {};
    const trait_pool: string[] = [];

    entries.forEach(entry => {
      entry.parsed.theme.forEach(theme => {
        theme_count[theme] = (theme_count[theme] || 0) + 1;
      });

      entry.parsed.vibe.forEach(vibe => {
        vibe_count[vibe] = (vibe_count[vibe] || 0) + 1;
      });

      entry.parsed.bucket.forEach(bucket => {
        bucket_count[bucket] = (bucket_count[bucket] || 0) + 1;
      });

      entry.parsed.persona_trait.forEach(trait => {
        if (!trait_pool.includes(trait)) {
          trait_pool.push(trait);
        }
      });
    });

    const top_themes = Object.entries(theme_count)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([theme]) => theme);

    const dominant_vibe = Object.entries(vibe_count)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "driven";

    const last_theme = entries[entries.length - 1]?.parsed.theme[0] || "general";

    return {
      top_themes,
      theme_count,
      dominant_vibe,
      vibe_count,
      bucket_count,
      trait_pool,
      last_theme
    };
  }
} 