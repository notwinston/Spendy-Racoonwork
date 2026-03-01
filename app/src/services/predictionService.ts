import { createLLMAdapter, resolveProvider } from './llm/adapter';
import type { LLMAdapter } from './llm/adapter';
import type {
  CalendarEvent,
  SpendingPrediction,
  EventCategory,
  ConfidenceLabel,
  LLMPredictionItem,
  LLMPredictionResponse,
  Budget,
  Transaction,
  HiddenCost,
  HiddenCostTier,
  EventCostBreakdown,
  DailyBrief,
  LLMHiddenCostItem,
  LLMHiddenCostResponse,
} from '../types';

// ---- Constants ----

const VALID_CATEGORIES: EventCategory[] = [
  'dining',
  'groceries',
  'transport',
  'entertainment',
  'shopping',
  'travel',
  'health',
  'education',
  'fitness',
  'social',
  'professional',
  'bills',
  'personal',
  'other',
];

function getModelVersion(): string {
  const provider = resolveProvider();
  switch (provider) {
    case 'claude':
      return 'claude-sonnet-4-20250514';
    case 'gemini':
      return 'gemini-2.0-flash';
    case 'mock':
    default:
      return 'mock-v1';
  }
}

// ---- Prompt builders ----

function buildSpendingPrompt(events: CalendarEvent[]): string {
  const eventDescriptions = events
    .map((event, idx) => {
      const parts = [
        `Event ${idx + 1}:`,
        `  [ID: ${event.id}]`,
        `  Title: ${event.title}`,
      ];
      if (event.description) {
        parts.push(`  Description: ${event.description}`);
      }
      if (event.location) {
        parts.push(`  Location: ${event.location}`);
      }
      parts.push(`  Start: ${event.start_time}`);
      if (event.end_time) {
        parts.push(`  End: ${event.end_time}`);
      }
      parts.push(`  All day: ${event.is_all_day ? 'yes' : 'no'}`);
      parts.push(`  Attendees: ${event.attendee_count}`);
      return parts.join('\n');
    })
    .join('\n\n');

  return `You are a spending prediction engine for a personal finance app.

Analyze each calendar event below and predict the likely spending category and dollar amount.

### Valid categories
${VALID_CATEGORIES.join(', ')}

### Events
${eventDescriptions}

### Instructions
For each event, predict:
- category: one of the valid categories listed above
- predicted_amount: the most likely dollar amount (USD) the user will spend
- prediction_low: the lower bound of a reasonable range
- prediction_high: the upper bound of a reasonable range
- confidence: a number between 0 and 1 indicating how confident you are
- explanation: a brief (1 sentence) reason for your prediction

Return your answer as a JSON object with a single key "predictions" containing an array.
Each element must have these exact keys: event_id, category, predicted_amount, prediction_low, prediction_high, confidence, explanation.
Use the event IDs provided in brackets [ID: ...].

Return ONLY valid JSON, no markdown fences, no extra text.`;
}

function buildInsightPrompt(context: {
  predictions?: SpendingPrediction[];
  transactions?: Transaction[];
  budgets?: Budget[];
}): string {
  const sections: string[] = [];

  if (context.predictions && context.predictions.length > 0) {
    const total = context.predictions.reduce(
      (sum, p) => sum + p.predicted_amount,
      0,
    );
    const categories = new Map<string, number>();
    for (const p of context.predictions) {
      categories.set(
        p.predicted_category,
        (categories.get(p.predicted_category) ?? 0) + p.predicted_amount,
      );
    }
    const topCategories = [...categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `  ${cat}: $${amt.toFixed(2)}`)
      .join('\n');

    sections.push(
      `### Upcoming Predicted Spending\nTotal: $${total.toFixed(2)}\nTop categories:\n${topCategories}`,
    );
  }

  if (context.transactions && context.transactions.length > 0) {
    const total = context.transactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );
    sections.push(
      `### Recent Transactions\nCount: ${context.transactions.length}\nTotal: $${total.toFixed(2)}`,
    );
  }

  if (context.budgets && context.budgets.length > 0) {
    const budgetLines = context.budgets
      .map((b) => `  ${b.category}: $${b.monthly_limit.toFixed(2)}/month`)
      .join('\n');
    sections.push(`### Active Budgets\n${budgetLines}`);
  }

  return `You are a friendly financial assistant in a personal finance app.

Based on the following spending data, provide a concise, actionable insight
(2-4 sentences) that helps the user understand and manage their spending.

${sections.join('\n\n')}

Be specific with numbers. Mention the biggest spending areas. If budgets are
present, mention whether the user is on track. Keep the tone encouraging but
honest. Do NOT use markdown formatting.`;
}

// ---- Response parsing ----

function toConfidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function isValidCategory(cat: string): cat is EventCategory {
  return VALID_CATEGORIES.includes(cat as EventCategory);
}

/**
 * Extract JSON from the LLM response, handling cases where the LLM wraps
 * it in markdown code fences.
 */
function extractJSON(raw: string): string {
  // Try stripping markdown fences
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Try finding JSON object directly
  const braceStart = raw.indexOf('{');
  const braceEnd = raw.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1);
  }

  return raw.trim();
}

function parsePredictionResponse(
  raw: string,
  events: CalendarEvent[],
  userId: string,
  modelVersion: string,
): SpendingPrediction[] {
  const jsonStr = extractJSON(raw);
  const parsed: LLMPredictionResponse = JSON.parse(jsonStr);

  if (!parsed.predictions || !Array.isArray(parsed.predictions)) {
    throw new Error('LLM response missing "predictions" array.');
  }

  // Map event IDs for lookup
  const eventMap = new Map(events.map((e) => [e.id, e]));

  return parsed.predictions
    .filter((item: LLMPredictionItem) => eventMap.has(item.event_id))
    .map((item: LLMPredictionItem): SpendingPrediction => {
      const category = isValidCategory(item.category)
        ? item.category
        : 'other';
      const confidence = Math.max(0, Math.min(1, item.confidence));

      return {
        id: `pred_${item.event_id}_${Date.now()}`,
        user_id: userId,
        calendar_event_id: item.event_id,
        predicted_category: category,
        predicted_amount: Math.round(item.predicted_amount * 100) / 100,
        prediction_low: Math.round((item.prediction_low ?? item.predicted_amount * 0.7) * 100) / 100,
        prediction_high: Math.round((item.prediction_high ?? item.predicted_amount * 1.4) * 100) / 100,
        confidence_score: Math.round(confidence * 100) / 100,
        confidence_label: toConfidenceLabel(confidence),
        model_version: modelVersion,
        explanation: item.explanation ?? null,
        actual_amount: null,
        was_accurate: null,
        created_at: new Date().toISOString(),
      };
    });
}

// ---- Singleton adapter cache ----

let adapterCache: LLMAdapter | null = null;

async function getAdapter(): Promise<LLMAdapter> {
  if (!adapterCache) {
    adapterCache = await createLLMAdapter();
  }
  return adapterCache;
}

/** Reset the cached adapter (useful for testing or switching providers). */
export function resetAdapter(): void {
  adapterCache = null;
}

// ---- Public API ----

/**
 * Predict spending for a batch of calendar events.
 *
 * Constructs a prompt, sends it to the active LLM adapter, and parses the
 * response into `SpendingPrediction` objects. Falls back to the mock adapter
 * on errors.
 */
export async function predictSpending(
  events: CalendarEvent[],
  userId: string = 'anonymous',
): Promise<SpendingPrediction[]> {
  if (events.length === 0) return [];

  const prompt = buildSpendingPrompt(events);
  const modelVersion = getModelVersion();

  try {
    const adapter = await getAdapter();
    const raw = await adapter.predict(prompt);
    return parsePredictionResponse(raw, events, userId, modelVersion);
  } catch (error) {
    console.warn(
      '[PredictionService] LLM call failed, falling back to mock adapter:',
      error,
    );

    // Fall back to mock
    try {
      const { MockAdapter } = await import('./llm/mock');
      const mock = new MockAdapter();
      const raw = await mock.predict(prompt);
      return parsePredictionResponse(raw, events, userId, 'mock-v1');
    } catch (mockError) {
      console.error(
        '[PredictionService] Mock adapter also failed:',
        mockError,
      );
      return [];
    }
  }
}

/**
 * Generate a natural-language insight from the user's financial context.
 */
export async function generateInsight(context: {
  predictions?: SpendingPrediction[];
  transactions?: Transaction[];
  budgets?: Budget[];
}): Promise<string> {
  const prompt = buildInsightPrompt(context);

  try {
    const adapter = await getAdapter();
    return await adapter.predict(prompt);
  } catch (error) {
    console.warn(
      '[PredictionService] Insight generation failed:',
      error,
    );
    // Return a static fallback insight
    return 'We are having trouble generating insights right now. Check back soon for personalised spending analysis.';
  }
}

// ---- Hidden Cost Prediction ----

export function buildHiddenCostPrompt(
  event: CalendarEvent,
  historicalTransactions: Transaction[],
  similarEvents: { title: string; total_spent: number; breakdown: string[] }[],
): string {
  const dayOfWeek = new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'long' });

  let historicalContext = '';
  if (similarEvents.length > 0) {
    historicalContext = '\n### Similar Past Events\n' +
      similarEvents.map(e => `- ${e.title}: $${e.total_spent.toFixed(2)} (${e.breakdown.join(', ')})`).join('\n');
  }

  let transactionContext = '';
  if (historicalTransactions.length > 0) {
    const recent = historicalTransactions.slice(0, 20);
    transactionContext = '\n### Recent Transaction Patterns\n' +
      recent.map(t => `- ${t.merchant_name ?? 'Unknown'}: $${t.amount.toFixed(2)} (${t.category})`).join('\n');
  }

  return `### Hidden Cost Analysis

Analyze this calendar event and predict 2-5 hidden costs the user might incur beyond the base event cost.

### Event Details
Title: ${event.title}
Location: ${event.location ?? 'Not specified'}
Time: ${event.start_time}${event.end_time ? ` to ${event.end_time}` : ''}
Day: ${dayOfWeek}
Attendees: ${event.attendee_count}
Category: ${event.category}
${event.description ? `Description: ${event.description}` : ''}
${historicalContext}
${transactionContext}

### Instructions
Predict 2-5 hidden costs with:
- label: short name (e.g., "Parking", "Drinks after")
- description: brief explanation of why this cost is likely
- predicted_amount: most likely dollar amount
- amount_low: lower bound estimate
- amount_high: upper bound estimate
- confidence: 0-1 how likely this cost will occur
- category: one of: ${VALID_CATEGORIES.join(', ')}
- signal_source: one of: historical, metadata, social, seasonal

Return ONLY valid JSON: { "hidden_costs": [...] }`;
}

export function parseHiddenCostResponse(
  raw: string,
  event: CalendarEvent,
  predictionId: string,
): HiddenCost[] {
  const jsonStr = extractJSON(raw);
  const parsed: LLMHiddenCostResponse = JSON.parse(jsonStr);

  if (!parsed.hidden_costs || !Array.isArray(parsed.hidden_costs)) {
    return [];
  }

  return parsed.hidden_costs.map((item: LLMHiddenCostItem): HiddenCost => {
    const confidence = Math.max(0, Math.min(1, item.confidence));
    const category = isValidCategory(item.category) ? item.category : 'other';

    let tier: HiddenCostTier;
    if (confidence >= 0.70) {
      tier = 'likely';
    } else if (confidence >= 0.30) {
      tier = 'possible';
    } else if (item.predicted_amount >= 50) {
      tier = 'unlikely_costly';
    } else {
      tier = 'possible';
    }

    const validSignalSources = ['historical', 'metadata', 'social', 'seasonal'] as const;
    const signalSource = validSignalSources.includes(item.signal_source as typeof validSignalSources[number])
      ? (item.signal_source as HiddenCost['signal_source'])
      : 'metadata';

    return {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      prediction_id: predictionId,
      calendar_event_id: event.id,
      label: item.label,
      description: item.description,
      predicted_amount: Math.round(item.predicted_amount * 100) / 100,
      amount_low: Math.round(item.amount_low * 100) / 100,
      amount_high: Math.round(item.amount_high * 100) / 100,
      tier,
      confidence_score: Math.round(confidence * 100) / 100,
      category,
      signal_source: signalSource,
      is_dismissed: false,
    };
  });
}

export function findSimilarTransactions(
  event: CalendarEvent,
  transactions: Transaction[],
): Transaction[] {
  const titleWords = event.title.toLowerCase().split(/\s+/).filter(w => w.length >= 3);

  return transactions
    .filter(t => {
      if (t.category === event.category) return true;
      if (t.merchant_name) {
        const merchantWords = t.merchant_name.toLowerCase().split(/\s+/);
        return titleWords.some(tw => merchantWords.some(mw => mw.includes(tw) || tw.includes(mw)));
      }
      return false;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

export async function predictHiddenCosts(
  events: CalendarEvent[],
  transactions: Transaction[],
  userId?: string,
): Promise<HiddenCost[]> {
  if (events.length === 0) return [];

  const adapter = await getAdapter();
  const allResults: HiddenCost[] = [];

  const promises = events.map(async (event) => {
    const similar = findSimilarTransactions(event, transactions);
    const prompt = buildHiddenCostPrompt(event, similar, []);
    const predictionId = `pred_hidden_${event.id}_${Date.now()}`;

    try {
      const raw = await adapter.predict(prompt);
      return parseHiddenCostResponse(raw, event, predictionId);
    } catch (error) {
      console.warn(`[PredictionService] Hidden cost prediction failed for event ${event.id}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  }

  return allResults;
}

export function buildEventCostBreakdowns(
  predictions: SpendingPrediction[],
  hiddenCosts: HiddenCost[],
): Record<string, EventCostBreakdown> {
  const predictionMap = new Map<string, SpendingPrediction>();
  for (const p of predictions) {
    predictionMap.set(p.calendar_event_id, p);
  }

  const costsByEvent = new Map<string, HiddenCost[]>();
  for (const cost of hiddenCosts) {
    const existing = costsByEvent.get(cost.calendar_event_id) ?? [];
    existing.push(cost);
    costsByEvent.set(cost.calendar_event_id, existing);
  }

  const breakdowns: Record<string, EventCostBreakdown> = {};

  const allEventIds = new Set([...predictionMap.keys(), ...costsByEvent.keys()]);
  for (const eventId of allEventIds) {
    const prediction = predictionMap.get(eventId);
    if (!prediction) continue;

    const costs = costsByEvent.get(eventId) ?? [];
    const activeCosts = costs.filter(c => !c.is_dismissed);

    const baseAmount = prediction.predicted_amount;
    const likelyCosts = activeCosts.filter(c => c.tier === 'likely');
    const possibleCosts = activeCosts.filter(c => c.tier === 'possible');
    const allActiveCosts = activeCosts;

    breakdowns[eventId] = {
      calendar_event_id: eventId,
      base_prediction: prediction,
      hidden_costs: costs,
      total_likely: baseAmount + likelyCosts.reduce((sum, c) => sum + c.predicted_amount, 0),
      total_possible: baseAmount + likelyCosts.reduce((sum, c) => sum + c.predicted_amount, 0) +
        possibleCosts.reduce((sum, c) => sum + c.predicted_amount, 0),
      total_with_risk: baseAmount + allActiveCosts.reduce((sum, c) => sum + c.predicted_amount, 0),
      historical_avg: null,
    };
  }

  return breakdowns;
}

export function generateDailyBrief(
  events: CalendarEvent[],
  predictions: SpendingPrediction[],
  hiddenCosts: HiddenCost[],
  budgets: Budget[],
): DailyBrief {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.start_time.split('T')[0] === todayStr);

  const breakdowns = buildEventCostBreakdowns(predictions, hiddenCosts);
  const todayBreakdowns: EventCostBreakdown[] = [];

  for (const event of todayEvents) {
    if (breakdowns[event.id]) {
      todayBreakdowns.push(breakdowns[event.id]);
    }
  }

  const totalPredictedLow = todayBreakdowns.reduce(
    (sum, b) => sum + b.base_prediction.predicted_amount, 0,
  );
  const totalPredictedHigh = todayBreakdowns.reduce(
    (sum, b) => sum + b.total_with_risk, 0,
  );

  const allHiddenCosts = todayBreakdowns.flatMap(b => b.hidden_costs.filter(c => !c.is_dismissed));

  let topWarning: string | null = null;
  if (allHiddenCosts.length > 0) {
    const highest = allHiddenCosts.reduce((max, c) =>
      c.predicted_amount > max.predicted_amount ? c : max, allHiddenCosts[0]);
    topWarning = highest.label;
  }

  let savingsOpportunity: string | null = null;
  if (allHiddenCosts.length > 0) {
    const lowestConfidence = allHiddenCosts.reduce((min, c) =>
      c.confidence_score < min.confidence_score ? c : min, allHiddenCosts[0]);
    savingsOpportunity = `Skip ${lowestConfidence.label} to save ~$${lowestConfidence.predicted_amount.toFixed(0)}`;
  }

  return {
    date: todayStr,
    events: todayBreakdowns,
    total_predicted_low: Math.round(totalPredictedLow * 100) / 100,
    total_predicted_high: Math.round(totalPredictedHigh * 100) / 100,
    top_warning: topWarning,
    savings_opportunity: savingsOpportunity,
  };
}
