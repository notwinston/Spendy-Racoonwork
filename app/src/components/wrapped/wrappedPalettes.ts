import type { EventCategory } from '../../types';

export type WrappedPalette = {
  accent: string;
  blob1: string;
  blob2: string;
  blob3: string;
};

export const WRAPPED_PALETTES: WrappedPalette[] = [
  { accent: '#C8F135', blob1: '#1e4a08', blob2: '#0b3020', blob3: '#4a8020' },  // 0: Intro
  { accent: '#FF5050', blob1: '#6B0018', blob2: '#8B1A1A', blob3: '#CC2020' },  // 1: Total Spent
  { accent: '#3DFFEA', blob1: '#003D4A', blob2: '#001518', blob3: '#00BBAA' },  // 2: Top Category
  { accent: '#FFD166', blob1: '#6A3D00', blob2: '#3A1A00', blob3: '#CC8800' },  // 3: Savings
  { accent: '#A259FF', blob1: '#2D1060', blob2: '#0E0720', blob3: '#6020CC' },  // 4: Budget Streak
  { accent: '#FF7A3D', blob1: '#6A2400', blob2: '#3A0E00', blob3: '#CC4400' },  // 5: Biggest Purchase
  { accent: '#3DFFEA', blob1: '#003040', blob2: '#001218', blob3: '#008888' },  // 6: Forecast
  { accent: '#C8F135', blob1: '#1e4a08', blob2: '#0b3020', blob3: '#4a8020' },  // 7: Summary
];

export const CATEGORY_EMOJI: Record<EventCategory, string> = {
  dining: '🍜',
  groceries: '🛒',
  transport: '🚗',
  entertainment: '🎬',
  shopping: '🛍️',
  travel: '✈️',
  health: '💊',
  education: '📚',
  fitness: '💪',
  social: '🎉',
  professional: '💼',
  bills: '📄',
  personal: '👤',
  other: '📦',
};
