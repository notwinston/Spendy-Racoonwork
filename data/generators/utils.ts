// Utility helpers for data generation

export type EventCategory =
  | 'dining' | 'groceries' | 'transport' | 'entertainment' | 'shopping'
  | 'travel' | 'health' | 'education' | 'fitness' | 'social'
  | 'professional' | 'bills' | 'personal' | 'other';

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  attendee_count: number;
  category: EventCategory;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

export interface Transaction {
  amount: number;
  merchant_name: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  is_recurring: boolean;
}

// Seeded pseudo-random number generator (mulberry32)
// Allows reproducible data generation
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _rng = createRng(42);

export function setRng(rng: () => number): void {
  _rng = rng;
}

export function random(): number {
  return _rng();
}

/** Random float in [min, max) */
export function randomInRange(min: number, max: number): number {
  return min + random() * (max - min);
}

/** Random integer in [min, max] inclusive */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + random() * (max - min + 1));
}

/** Random amount with natural variance (base +/- variancePct) rounded to 2 decimals */
export function randomAmount(base: number, variancePct: number = 0.15): number {
  const factor = 1 + (random() * 2 - 1) * variancePct;
  return Math.round(base * factor * 100) / 100;
}

/** Pick random element from array */
export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

/** Pick random element from weighted options */
export function weightedChoice<T>(options: { value: T; weight: number }[]): T {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let r = random() * totalWeight;
  for (const opt of options) {
    r -= opt.weight;
    if (r <= 0) return opt.value;
  }
  return options[options.length - 1].value;
}

/** Returns true with given probability (0-1) */
export function chance(probability: number): boolean {
  return random() < probability;
}

/** Iterate over each day in a date range [start, end] inclusive */
export function* iterateDays(start: Date, end: Date): Generator<Date> {
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    yield new Date(current);
    current.setDate(current.getDate() + 1);
  }
}

/** Format date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format date as ISO 8601 datetime string */
export function formatDateTime(date: Date): string {
  return date.toISOString();
}

/** Create a Date at a specific time on a given day */
export function dateAtTime(day: Date, hours: number, minutes: number = 0): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Add minutes to a date */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Get day of week: 0=Sunday, 6=Saturday */
export function dayOfWeek(date: Date): number {
  return date.getDay();
}

/** Check if date falls on a weekend */
export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

/** Check if date is a specific day of week (0=Sun, 1=Mon, ...) */
export function isDayOfWeek(date: Date, ...days: number[]): boolean {
  return days.includes(date.getDay());
}

/** Get the week number within the month (0-indexed) */
export function weekOfMonth(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7);
}

/** Shuffle array in place */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
