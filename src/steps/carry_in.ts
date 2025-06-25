/**
 * Step 07: CARRY_IN DETECTION MODULE
 * 
 * This module computes whether the current diary entry "carries in"
 * previous themes or emotional content from recent diary entries.
 * 
 * Logic:
 * - If no recent entries: carry_in = false
 * - If any recent entry shares theme(s) OR has cosine similarity > 0.86 → carry_in = true
 * 
 * This is a utility used by pipeline.ts → step07_carryIn()
 * 
 * Dependencies: 
 * - cosineSimilarity() from utils/math
 * - Embedding should already be computed before calling
 */

import { cosineSimilarity } from '../utils/math'; // you must ensure this util exists or define inline
import { DiaryEntry } from '../types';

export interface CarryInResult {
  carry_in: boolean;
  similarity_score: number;
  matching_themes: string[];
}

export function detectCarryIn(
  currentEmbedding: number[],
  currentThemes: string[],
  recentEntries: DiaryEntry[],
  similarityThreshold: number = 0.86
): CarryInResult {
  if (recentEntries.length === 0) {
    return {
      carry_in: false,
      similarity_score: 0,
      matching_themes: []
    };
  }

  // Extract all themes from recent entries
  const recentThemes = recentEntries.flatMap(entry => entry.parsed?.theme || []);
  const matchingThemes = currentThemes.filter(theme => recentThemes.includes(theme));

  // Compare embedding with all recent entries to find max similarity
  let maxSim = 0;
  for (const entry of recentEntries) {
    const prevVec = entry.embedding || [];
    const sim = cosineSimilarity(currentEmbedding, prevVec);
    if (sim > maxSim) maxSim = sim;
  }

  const carry_in = matchingThemes.length > 0 || maxSim >= similarityThreshold;

  return {
    carry_in,
    similarity_score: Math.round(maxSim * 1000) / 1000,
    matching_themes: matchingThemes
  };
}