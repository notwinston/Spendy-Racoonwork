import type { LLMAdapter } from './adapter';
import type { EventCategory, LLMPredictionItem, HiddenCostTier } from '../../types';

// ---- Hidden cost prompt detection marker ----

const HIDDEN_COST_PROMPT_MARKER = '### Hidden Cost Analysis';

// ---- Keyword-to-category mapping with typical dollar ranges ----

interface CategoryRule {
  category: EventCategory;
  min: number;
  max: number;
}

// ---- Hidden cost rules ----

interface HiddenCostTemplate {
  label: string;
  tier: HiddenCostTier;
  category: EventCategory;
  min: number;
  max: number;
}

const HIDDEN_COST_RULES: Record<string, HiddenCostTemplate[]> = {
  dinner: [
    { label: 'Drinks after', tier: 'likely', category: 'dining', min: 15, max: 40 },
    { label: 'Uber home', tier: 'possible', category: 'transport', min: 12, max: 35 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 5, max: 15 },
  ],
  restaurant: [
    { label: 'Drinks after', tier: 'likely', category: 'dining', min: 15, max: 40 },
    { label: 'Uber home', tier: 'possible', category: 'transport', min: 12, max: 35 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 5, max: 15 },
  ],
  earls: [
    { label: 'Drinks after', tier: 'likely', category: 'dining', min: 15, max: 40 },
    { label: 'Uber home', tier: 'possible', category: 'transport', min: 12, max: 35 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 5, max: 15 },
  ],
  lunch: [
    { label: 'Coffee after', tier: 'likely', category: 'dining', min: 4, max: 8 },
    { label: 'Dessert', tier: 'possible', category: 'dining', min: 5, max: 12 },
  ],
  'team lunch': [
    { label: 'Coffee after', tier: 'likely', category: 'dining', min: 4, max: 8 },
    { label: 'Dessert', tier: 'possible', category: 'dining', min: 5, max: 12 },
  ],
  nuba: [
    { label: 'Coffee after', tier: 'likely', category: 'dining', min: 4, max: 8 },
    { label: 'Dessert', tier: 'possible', category: 'dining', min: 5, max: 12 },
  ],
  gym: [
    { label: 'Post-workout smoothie', tier: 'likely', category: 'fitness', min: 6, max: 12 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 3, max: 10 },
  ],
  workout: [
    { label: 'Post-workout smoothie', tier: 'likely', category: 'fitness', min: 6, max: 12 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 3, max: 10 },
  ],
  equinox: [
    { label: 'Post-workout smoothie', tier: 'likely', category: 'fitness', min: 6, max: 12 },
    { label: 'Parking', tier: 'possible', category: 'transport', min: 3, max: 10 },
  ],
  trip: [
    { label: 'Gas', tier: 'likely', category: 'transport', min: 30, max: 70 },
    { label: 'Meals', tier: 'likely', category: 'dining', min: 20, max: 50 },
    { label: 'Emergency supplies', tier: 'unlikely_costly', category: 'shopping', min: 20, max: 80 },
  ],
  weekend: [
    { label: 'Gas', tier: 'likely', category: 'transport', min: 30, max: 70 },
    { label: 'Meals', tier: 'likely', category: 'dining', min: 20, max: 50 },
    { label: 'Emergency supplies', tier: 'unlikely_costly', category: 'shopping', min: 20, max: 80 },
  ],
  whistler: [
    { label: 'Gas', tier: 'likely', category: 'transport', min: 30, max: 70 },
    { label: 'Meals', tier: 'likely', category: 'dining', min: 20, max: 50 },
    { label: 'Emergency supplies', tier: 'unlikely_costly', category: 'shopping', min: 20, max: 80 },
  ],
  birthday: [
    { label: 'Gift', tier: 'likely', category: 'shopping', min: 20, max: 60 },
    { label: 'Drinks', tier: 'possible', category: 'dining', min: 15, max: 45 },
  ],
  party: [
    { label: 'Gift', tier: 'likely', category: 'shopping', min: 20, max: 60 },
    { label: 'Drinks', tier: 'possible', category: 'dining', min: 15, max: 45 },
  ],
  concert: [
    { label: 'Drinks', tier: 'likely', category: 'dining', min: 15, max: 40 },
    { label: 'Merch', tier: 'possible', category: 'shopping', min: 20, max: 60 },
    { label: 'Uber', tier: 'possible', category: 'transport', min: 12, max: 30 },
  ],
  show: [
    { label: 'Drinks', tier: 'likely', category: 'dining', min: 15, max: 40 },
    { label: 'Merch', tier: 'possible', category: 'shopping', min: 20, max: 60 },
    { label: 'Uber', tier: 'possible', category: 'transport', min: 12, max: 30 },
  ],
  coffee: [
    { label: 'Pastry/snack', tier: 'possible', category: 'dining', min: 3, max: 8 },
  ],
  cafe: [
    { label: 'Pastry/snack', tier: 'possible', category: 'dining', min: 3, max: 8 },
  ],
  starbucks: [
    { label: 'Pastry/snack', tier: 'possible', category: 'dining', min: 3, max: 8 },
  ],
  date: [
    { label: 'Activity after', tier: 'possible', category: 'entertainment', min: 15, max: 45 },
    { label: 'Flowers/gift', tier: 'possible', category: 'shopping', min: 15, max: 30 },
  ],
  conference: [
    { label: 'Coffee', tier: 'likely', category: 'dining', min: 4, max: 7 },
    { label: 'Lunch', tier: 'possible', category: 'dining', min: 12, max: 25 },
  ],
  meeting: [
    { label: 'Coffee', tier: 'likely', category: 'dining', min: 4, max: 7 },
    { label: 'Lunch', tier: 'possible', category: 'dining', min: 12, max: 25 },
  ],
};

const KEYWORD_RULES: Record<string, CategoryRule> = {
  // Dining
  dinner: { category: 'dining', min: 30, max: 75 },
  restaurant: { category: 'dining', min: 25, max: 80 },
  lunch: { category: 'dining', min: 12, max: 35 },
  breakfast: { category: 'dining', min: 8, max: 25 },
  brunch: { category: 'dining', min: 20, max: 50 },
  cafe: { category: 'dining', min: 5, max: 20 },
  coffee: { category: 'dining', min: 4, max: 10 },
  sushi: { category: 'dining', min: 30, max: 80 },
  pizza: { category: 'dining', min: 15, max: 40 },
  bar: { category: 'dining', min: 20, max: 60 },
  drinks: { category: 'dining', min: 15, max: 50 },

  // Groceries
  grocery: { category: 'groceries', min: 30, max: 120 },
  groceries: { category: 'groceries', min: 30, max: 120 },
  supermarket: { category: 'groceries', min: 40, max: 150 },
  'farmers market': { category: 'groceries', min: 20, max: 60 },
  costco: { category: 'groceries', min: 80, max: 250 },

  // Transport
  uber: { category: 'transport', min: 10, max: 40 },
  lyft: { category: 'transport', min: 10, max: 40 },
  taxi: { category: 'transport', min: 15, max: 50 },
  gas: { category: 'transport', min: 30, max: 70 },
  parking: { category: 'transport', min: 5, max: 30 },
  'car wash': { category: 'transport', min: 10, max: 30 },

  // Entertainment
  concert: { category: 'entertainment', min: 40, max: 200 },
  movie: { category: 'entertainment', min: 15, max: 30 },
  show: { category: 'entertainment', min: 30, max: 150 },
  theater: { category: 'entertainment', min: 40, max: 120 },
  theatre: { category: 'entertainment', min: 40, max: 120 },
  game: { category: 'entertainment', min: 20, max: 80 },
  museum: { category: 'entertainment', min: 10, max: 35 },
  festival: { category: 'entertainment', min: 30, max: 100 },

  // Shopping
  shopping: { category: 'shopping', min: 30, max: 200 },
  mall: { category: 'shopping', min: 40, max: 250 },
  store: { category: 'shopping', min: 20, max: 100 },
  amazon: { category: 'shopping', min: 20, max: 150 },

  // Travel
  flight: { category: 'travel', min: 200, max: 800 },
  hotel: { category: 'travel', min: 100, max: 300 },
  airbnb: { category: 'travel', min: 80, max: 250 },
  vacation: { category: 'travel', min: 500, max: 2000 },
  trip: { category: 'travel', min: 200, max: 1500 },

  // Health
  doctor: { category: 'health', min: 50, max: 300 },
  dentist: { category: 'health', min: 100, max: 400 },
  pharmacy: { category: 'health', min: 10, max: 60 },
  therapy: { category: 'health', min: 80, max: 200 },
  hospital: { category: 'health', min: 100, max: 500 },

  // Education
  class: { category: 'education', min: 30, max: 200 },
  course: { category: 'education', min: 50, max: 500 },
  tutor: { category: 'education', min: 40, max: 100 },
  workshop: { category: 'education', min: 25, max: 150 },
  lecture: { category: 'education', min: 0, max: 50 },
  seminar: { category: 'education', min: 20, max: 100 },

  // Fitness
  gym: { category: 'fitness', min: 0, max: 30 },
  yoga: { category: 'fitness', min: 10, max: 30 },
  workout: { category: 'fitness', min: 0, max: 20 },
  pilates: { category: 'fitness', min: 15, max: 35 },
  crossfit: { category: 'fitness', min: 15, max: 35 },
  swim: { category: 'fitness', min: 5, max: 15 },
  run: { category: 'fitness', min: 0, max: 10 },

  // Social
  party: { category: 'social', min: 20, max: 80 },
  birthday: { category: 'social', min: 30, max: 100 },
  wedding: { category: 'social', min: 50, max: 300 },
  meetup: { category: 'social', min: 5, max: 30 },

  // Professional
  conference: { category: 'professional', min: 50, max: 500 },
  meeting: { category: 'professional', min: 0, max: 20 },
  networking: { category: 'professional', min: 10, max: 50 },
  interview: { category: 'professional', min: 0, max: 20 },

  // Bills
  rent: { category: 'bills', min: 800, max: 2500 },
  utilities: { category: 'bills', min: 50, max: 200 },
  insurance: { category: 'bills', min: 50, max: 300 },
  subscription: { category: 'bills', min: 5, max: 30 },

  // Personal
  haircut: { category: 'personal', min: 20, max: 80 },
  salon: { category: 'personal', min: 30, max: 150 },
  spa: { category: 'personal', min: 50, max: 200 },
  massage: { category: 'personal', min: 60, max: 150 },
};

// ---- Helpers ----

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function confidenceFor(matched: boolean): number {
  return matched ? randomBetween(0.7, 0.95) : randomBetween(0.3, 0.55);
}

function confidenceLabel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function matchEvent(title: string, description: string | null): CategoryRule | null {
  const text = `${title} ${description ?? ''}`.toLowerCase();

  for (const [keyword, rule] of Object.entries(KEYWORD_RULES)) {
    if (text.includes(keyword)) {
      return rule;
    }
  }
  return null;
}

const DEFAULT_RULE: CategoryRule = { category: 'other', min: 10, max: 50 };

/**
 * Build a mock LLM-style JSON response for a list of events described in
 * the prompt text. The prompt produced by predictionService contains a
 * "### Events" section with one event per block containing `[ID: ...]`.
 */
function buildMockResponse(prompt: string): string {
  // Extract event blocks from the prompt. Each block starts with "Event N:"
  const eventRegex = /\[ID:\s*([^\]]+)\].*?Title:\s*(.+?)(?:\n|$)(?:.*?Description:\s*(.+?)(?:\n|$))?/gi;

  const predictions: LLMPredictionItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = eventRegex.exec(prompt)) !== null) {
    const eventId = match[1].trim();
    const title = match[2].trim();
    const description = match[3]?.trim() ?? null;

    const rule = matchEvent(title, description) ?? DEFAULT_RULE;
    const amount = randomBetween(rule.min, rule.max);
    const low = Math.max(0, Math.round(amount * 0.7 * 100) / 100);
    const high = Math.round(amount * 1.4 * 100) / 100;
    const conf = confidenceFor(rule !== DEFAULT_RULE);

    predictions.push({
      event_id: eventId,
      category: rule.category,
      predicted_amount: amount,
      prediction_low: low,
      prediction_high: high,
      confidence: Math.round(conf * 100) / 100,
      explanation:
        rule !== DEFAULT_RULE
          ? `Based on the event title "${title}", this looks like a ${rule.category} expense.`
          : `Could not confidently categorise "${title}"; defaulting to other.`,
    });
  }

  return JSON.stringify({ predictions }, null, 2);
}

// ---- Hidden cost mock response ----

function hiddenCostConfidence(tier: HiddenCostTier): number {
  switch (tier) {
    case 'likely': return randomBetween(0.75, 0.95);
    case 'possible': return randomBetween(0.35, 0.65);
    case 'unlikely_costly': return randomBetween(0.10, 0.25);
  }
}

function buildMockHiddenCostResponse(prompt: string): string {
  const titleMatch = prompt.match(/Title:\s*(.+?)(?:\n|$)/i);
  const title = titleMatch ? titleMatch[1].trim().toLowerCase() : '';

  const hiddenCosts: {
    label: string;
    description: string;
    predicted_amount: number;
    amount_low: number;
    amount_high: number;
    confidence: number;
    category: string;
    signal_source: string;
  }[] = [];

  const signalSources = ['historical', 'metadata', 'social', 'seasonal'] as const;

  for (const [keyword, templates] of Object.entries(HIDDEN_COST_RULES)) {
    if (title.includes(keyword.toLowerCase())) {
      for (const tpl of templates) {
        if (tpl.tier === 'unlikely_costly') continue;
        const amount = randomBetween(tpl.min, tpl.max);
        hiddenCosts.push({
          label: tpl.label,
          description: `${tpl.label} is ${tpl.tier} when attending "${titleMatch ? titleMatch[1].trim() : 'event'}"`,
          predicted_amount: amount,
          amount_low: Math.round(tpl.min * 100) / 100,
          amount_high: Math.round(tpl.max * 100) / 100,
          confidence: Math.round(hiddenCostConfidence(tpl.tier) * 100) / 100,
          category: tpl.category,
          signal_source: signalSources[Math.floor(Math.random() * signalSources.length)],
        });
      }
      break;
    }
  }

  return JSON.stringify({ hidden_costs: hiddenCosts }, null, 2);
}

/**
 * Mock adapter that returns realistic predictions without calling any API.
 *
 * Useful for development, testing, and when no API keys are configured.
 */
export class MockAdapter implements LLMAdapter {
  async predict(prompt: string): Promise<string> {
    // Simulate network latency
    await delay(300 + Math.random() * 400);

    // Check for hidden cost prompt
    if (prompt.includes(HIDDEN_COST_PROMPT_MARKER)) {
      return buildMockHiddenCostResponse(prompt);
    }

    return buildMockResponse(prompt);
  }

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    await delay(200);
    const full = buildMockResponse(prompt);

    // Simulate streaming by emitting small chunks
    const chunkSize = 40;
    for (let i = 0; i < full.length; i += chunkSize) {
      onChunk(full.slice(i, i + chunkSize));
      await delay(15 + Math.random() * 25);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
