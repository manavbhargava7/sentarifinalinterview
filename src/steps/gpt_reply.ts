/**
 * Step 11: GPT_REPLY
 *
 * Generates an emotionally intelligent, personalized response
 * to a diary entry, based on parsed data, user profile, and
 * carry-in/contrast context. Replies aim to be:
 *  - ≤ 55 characters
 *  - Empathic and theme-aware
 *  - Emoji-annotated (for 100th entry context)
 *
 * This module is MOCK-based, and designed to match behavior in pipeline.ts.
 */

import { ParsedEntry, UserProfile } from '../types';

// Emoji mapping per vibe
function getVibeEmoji(vibe: string): string {
  const emojis: Record<string, string> = {
    'excited': '🚀',
    'driven': '💪',
    'anxious': '😰',
    'exhausted': '💤',
    'curious': '🤔',
    'overwhelmed': '😵'
  };
  return emojis[vibe] || '💭';
}

export function generateEmpathicReply(
  parsed: ParsedEntry,
  profile: UserProfile,
  carry_in: boolean,
  emotion_flip: boolean
): string {
  const isFirstEntry = Object.keys(profile.vibe_count).length <= 1;
  const dominantVibe = parsed.vibe[0] || 'neutral';
  const theme = parsed.theme[0] || 'general';

  let response = '';

  if (isFirstEntry) {
    const firstResponses: Record<string, string> = {
      'anxious': "Sounds like you're drained but trying—rest is not failure.",
      'exhausted': "You deserve rest without guilt. Take care of yourself.",
      'driven': "Your motivation shows. Balance drive with self-care.",
      'excited': "Love the energy! Channel it mindfully.",
      'default': "Thanks for sharing. Your feelings are valid."
    };
    response = firstResponses[dominantVibe] || firstResponses['default'];

    if (emotion_flip) {
      response += ' Big shift today 🔄';
    }
  } else {
    // Later entries (e.g. 100th)
    if (carry_in) {
      response = `🧩 You're still ${theme.replace('-', ' ')}-focused! `;
    } else {
      response = `✨ New energy detected: ${dominantVibe}! `;
    }

    if (emotion_flip) {
      response += 'Big shift today 🔄';
    } else {
      response += `${getVibeEmoji(dominantVibe)} Keep going`;
    }
  }

  // Truncate to ≤ 55 characters
  if (response.length > 55) {
    response = response.slice(0, 52) + '...';
  }

  console.log(
    `[GPT_REPLY] input="vibe:${dominantVibe}, carry:${carry_in}" | output="${response}" | note="[MOCK] Empathic response generated (${response.length} chars)"`
  );

  return response;
}