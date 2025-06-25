import { ParsedEntry, UserProfile } from '../types';

export function step11_gptReply(
    parsed: ParsedEntry,
    profile: UserProfile,
    carry_in: boolean,
    emotion_flip: boolean
): string {
    const vibe = parsed.vibe[0] || "neutral";
    const theme = parsed.theme[0] || "general";
    const is_first_entry = Object.keys(profile.theme_count).length === 0;

    let response_text = "";

    if (is_first_entry) {
        // First entry responses
        const first_responses: Record<string, string> = {
            'anxious': "Sounds like you're drained but trying—rest is not failure.",
            'excited': "Your energy is contagious! Keep that momentum going.",
            'exhausted': "You're pushing hard—remember to recharge too.",
            'driven': "That determination will take you far. Stay focused!",
            'curious': "Love that curiosity! Keep exploring and learning.",
            'overwhelmed': "It's okay to feel this way. One step at a time.",
            'neutral': "Thanks for sharing. Every entry builds your story."
        };
        response_text = first_responses[vibe] || first_responses['neutral'];
    } else {
        // Subsequent entries with carry-in logic
        const emoji = getVibeEmoji(vibe);
        const carry_emoji = carry_in ? "🧩" : "";
        const flip_emoji = emotion_flip ? "🔄" : "";

        const responses: Record<string, string> = {
            'anxious': `${carry_emoji} You're still wired-in, but self-care matters too 💤`,
            'excited': `${carry_emoji} That energy keeps building! ${flip_emoji} Amazing progress`,
            'exhausted': `${carry_emoji} Even warriors need rest. ${flip_emoji} Recharge time`,
            'driven': `${carry_emoji} Your focus is unwavering! ${flip_emoji} Keep pushing`,
            'curious': `${carry_emoji} Always learning, always growing ${flip_emoji} 🌱`,
            'overwhelmed': `${carry_emoji} It's a lot, but you've got this ${flip_emoji} 💪`,
            'neutral': `${carry_emoji} Steady progress, day by day ${flip_emoji} 📝`
        };

        response_text = responses[vibe] || responses['neutral'];
    }

    console.log(`[GPT_REPLY] input="vibe:${vibe}, theme:${theme}, carry:${carry_in}" | output="${response_text}" | note="[MOCK] Empathic response generated"`);

    return response_text;
}

function getVibeEmoji(vibe: string): string {
    const emoji_map: Record<string, string> = {
        'anxious': '😰',
        'excited': '🎉',
        'exhausted': '😴',
        'driven': '💪',
        'curious': '🤔',
        'overwhelmed': '😵',
        'neutral': '📝'
    };
    return emoji_map[vibe] || '📝';
} 