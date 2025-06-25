import { PipelineOutput, UserProfile } from '../types';

export function step12_publish(
    entryId: string,
    response_text: string,
    carry_in: boolean,
    emotion_flip: boolean,
    updated_profile: UserProfile
): PipelineOutput {
    const output: PipelineOutput = {
        entryId,
        response_text,
        carry_in,
        emotion_flip,
        updated_profile
    };

    console.log(`[PUBLISH] input="entry:${entryId}, response:${response_text.length}chars" | output="published" | note="Pipeline output packaged"`);

    return output;
} 