// Raccoon evolution stages, emotional state logic, image mapping, and financial tips
// for the Tomodachi companion system.

export type RaccoonStage = 'messy' | 'backpack' | 'clean' | 'sunglasses' | 'ceo';
export type RaccoonEmotion = 'happy' | 'concerned' | 'angry' | 'celebrating';

export interface StageThreshold {
  stage: RaccoonStage;
  label: string;
  description: string;
  xpRequired: number;
  streakConsistency: number; // percentage 0–100
  questsRequired: number;
  emoji: string;
}

export const STAGES: StageThreshold[] = [
  { stage: 'messy', label: 'Messy Raccoon', description: 'Ragged grey t-shirt, just getting started', xpRequired: 0, streakConsistency: 0, questsRequired: 0, emoji: '🦝' },
  { stage: 'backpack', label: 'Backpack Raccoon', description: 'Navy bomber jacket & backpack — building habits', xpRequired: 500, streakConsistency: 25, questsRequired: 10, emoji: '🎒' },
  { stage: 'clean', label: 'Clean Raccoon', description: 'Blue turtleneck & glasses — disciplined saver', xpRequired: 2000, streakConsistency: 50, questsRequired: 30, emoji: '🧹' },
  { stage: 'sunglasses', label: 'Sunglasses Raccoon', description: 'Hawaiian shirt & shades — financially chill', xpRequired: 5000, streakConsistency: 70, questsRequired: 60, emoji: '😎' },
  { stage: 'ceo', label: 'CEO Raccoon', description: 'Black suit & shades — financial elite', xpRequired: 10000, streakConsistency: 85, questsRequired: 100, emoji: '🏆' },
];

/**
 * Returns the highest stage where ALL three criteria are met.
 * Evolution is permanent (highest achieved).
 */
export function getRaccoonStage(
  xp: number,
  streakConsistency: number,
  questsCompleted: number,
): StageThreshold {
  let highest = STAGES[0];
  for (const s of STAGES) {
    if (xp >= s.xpRequired && streakConsistency >= s.streakConsistency && questsCompleted >= s.questsRequired) {
      highest = s;
    }
  }
  return highest;
}

/**
 * Returns the next stage after the current one, or null if at max.
 */
export function getNextStage(current: RaccoonStage): StageThreshold | null {
  const idx = STAGES.findIndex((s) => s.stage === current);
  return idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
}

/**
 * Determines the raccoon's emotional state based on financial health.
 */
export function getRaccoonEmotion(
  healthScore: number | null,
  _savingsRate: number,
  recentMilestone: boolean,
): RaccoonEmotion {
  if (recentMilestone) return 'celebrating';
  const score = healthScore ?? 75; // default to happy if unknown
  if (score > 70) return 'happy';
  if (score >= 40) return 'concerned';
  return 'angry';
}

/** Emotion display config */
export const EMOTION_CONFIG: Record<RaccoonEmotion, { icon: string; label: string; color: string }> = {
  happy: { icon: '😊', label: 'Happy', color: '#10B981' },
  concerned: { icon: '😟', label: 'Concerned', color: '#F59E0B' },
  angry: { icon: '😠', label: 'Frustrated', color: '#EF4444' },
  celebrating: { icon: '🎉', label: 'Celebrating', color: '#8B5CF6' },
};

/**
 * Static image map for raccoon PNGs.
 * Keys: `{stage}-{emotion}`, values: require() calls.
 * Each stage has a unique raccoon image; emotions share the same stage image.
 */
const raccoonMessy = require('../assets/raccoon/raccoon-messy.png');
const raccoonBackpack = require('../assets/raccoon/raccoon-backpack.png');
const raccoonClean = require('../assets/raccoon/raccoon-clean.png');
const raccoonSunglasses = require('../assets/raccoon/raccoon-sunglasses.png');
const raccoonCeo = require('../assets/raccoon/raccoon-ceo.png');

export const RACCOON_IMAGES: Record<string, number | null> = {
  // messy — grey t-shirt, just getting started
  'messy-happy': raccoonMessy,
  'messy-concerned': raccoonMessy,
  'messy-angry': raccoonMessy,
  'messy-celebrating': raccoonMessy,
  // backpack — navy varsity jacket & backpack
  'backpack-happy': raccoonBackpack,
  'backpack-concerned': raccoonBackpack,
  'backpack-angry': raccoonBackpack,
  'backpack-celebrating': raccoonBackpack,
  // clean — blue turtleneck & glasses
  'clean-happy': raccoonClean,
  'clean-concerned': raccoonClean,
  'clean-angry': raccoonClean,
  'clean-celebrating': raccoonClean,
  // sunglasses — hawaiian shirt & shades
  'sunglasses-happy': raccoonSunglasses,
  'sunglasses-concerned': raccoonSunglasses,
  'sunglasses-angry': raccoonSunglasses,
  'sunglasses-celebrating': raccoonSunglasses,
  // ceo — black suit & shades
  'ceo-happy': raccoonCeo,
  'ceo-concerned': raccoonCeo,
  'ceo-angry': raccoonCeo,
  'ceo-celebrating': raccoonCeo,
};

export function getRaccoonImage(stage: RaccoonStage, emotion: RaccoonEmotion): number | null {
  return RACCOON_IMAGES[`${stage}-${emotion}`] ?? null;
}

/**
 * Derive streak consistency from streakCount and longestStreak.
 * Gives a reasonable 0–100 percentage approximation.
 */
export function getStreakConsistency(streakCount: number, longestStreak: number): number {
  if (longestStreak <= 0) return streakCount > 0 ? 100 : 0;
  return Math.min(100, Math.round((streakCount / longestStreak) * 100));
}

/**
 * Approximate total quests completed from earned badges and completed challenges.
 */
export function getQuestsCompleted(
  earnedBadgesCount: number,
  completedChallengesCount: number,
): number {
  return earnedBadgesCount * 5 + completedChallengesCount;
}

// --- Financial tips ---

type FinancialState = 'overspending' | 'on-track' | 'saving-well' | 'general';

interface Tip {
  text: string;
  state: FinancialState;
}

const TIPS: Tip[] = [
  // Overspending
  { text: "Try a no-spend day today — your raccoon believes in you!", state: 'overspending' },
  { text: "Review your subscriptions. Even small ones add up fast.", state: 'overspending' },
  { text: "Before buying, wait 24 hours. Most impulse urges fade.", state: 'overspending' },
  { text: "Pack lunch instead of eating out — save $50+ a week!", state: 'overspending' },
  { text: "Set a daily spending cap and track it tonight.", state: 'overspending' },
  // On track
  { text: "Great discipline! Can you bump your savings by just 1%?", state: 'on-track' },
  { text: "You're on track! Consider starting an emergency fund next.", state: 'on-track' },
  { text: "Consistency beats intensity. Keep going!", state: 'on-track' },
  { text: "Review your goals weekly to stay motivated.", state: 'on-track' },
  { text: "Nice work! Try automating one more bill payment.", state: 'on-track' },
  // Saving well
  { text: "Amazing saving! Consider investing some of that surplus.", state: 'saving-well' },
  { text: "Your future self will thank you for today's discipline.", state: 'saving-well' },
  { text: "You're crushing it! Time to set a bigger financial goal?", state: 'saving-well' },
  { text: "Financial freedom looks good on you. Keep stacking!", state: 'saving-well' },
  { text: "Pro tip: diversify your savings across accounts.", state: 'saving-well' },
  // General
  { text: "Pay yourself first — save before you spend.", state: 'general' },
  { text: "Track every dollar for a week. You'll be surprised!", state: 'general' },
  { text: "The best budget is one you actually follow.", state: 'general' },
  { text: "Small wins build big habits. Celebrate progress!", state: 'general' },
  { text: "Your raccoon is proud of every step you take.", state: 'general' },
];

/**
 * Select a contextual tip based on the user's financial state.
 * Mixes in a general tip occasionally for variety.
 */
export function getTip(savingsRate: number): string {
  let state: FinancialState;
  if (savingsRate < 5) state = 'overspending';
  else if (savingsRate < 20) state = 'on-track';
  else state = 'saving-well';

  // 30% chance of a general tip for variety
  const useGeneral = Math.random() < 0.3;
  const pool = TIPS.filter((t) => t.state === (useGeneral ? 'general' : state));
  return pool[Math.floor(Math.random() * pool.length)].text;
}
