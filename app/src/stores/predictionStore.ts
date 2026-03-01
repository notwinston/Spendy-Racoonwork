import { create } from 'zustand';
import type {
  CalendarEvent,
  SpendingPrediction,
  FeedbackType,
  EventCategory,
  HiddenCost,
  EventCostBreakdown,
  DailyBrief,
  Budget,
  Transaction,
} from '../types';
import {
  predictSpending,
  generateInsight,
  predictHiddenCosts,
  buildEventCostBreakdowns,
  generateDailyBrief as buildDailyBrief,
} from '../services/predictionService';

// ---- Store types ----

interface PredictionState {
  /** All known predictions, keyed conceptually by calendar_event_id. */
  predictions: SpendingPrediction[];

  /** The latest AI-generated insight string. */
  insight: string | null;

  /** True while loading predictions from a cache / persistence layer. */
  isLoading: boolean;

  /** True while the LLM is actively generating new predictions. */
  isPredicting: boolean;

  /** Last error message, if any. */
  error: string | null;

  /** Hidden costs predicted for events. */
  hiddenCosts: HiddenCost[];

  /** Cost breakdowns grouped by event ID. */
  eventCostBreakdowns: Record<string, EventCostBreakdown>;

  /** Today's daily brief. */
  dailyBrief: DailyBrief | null;

  /** True while analyzing hidden costs. */
  isAnalyzingHiddenCosts: boolean;

  // ---- Actions ----

  /**
   * Populate the store with predictions (e.g. from Supabase or local cache).
   * Replaces the entire list.
   */
  fetchPredictions: (predictions: SpendingPrediction[]) => void;

  /**
   * Run the LLM prediction pipeline for a set of calendar events.
   * Merges results into the existing predictions list (replacing any that
   * share the same calendar_event_id).
   */
  generatePredictions: (events: CalendarEvent[], userId?: string) => Promise<void>;

  /**
   * Generate an AI insight based on the current predictions plus optional
   * transaction and budget data.
   */
  generateInsight: (context?: {
    predictions?: SpendingPrediction[];
    transactions?: unknown[];
    budgets?: unknown[];
  }) => Promise<void>;

  /**
   * Record user feedback on a prediction (used for future model improvement).
   */
  submitFeedback: (
    predictionId: string,
    feedbackType: FeedbackType,
    correctedCategory?: EventCategory,
    correctedAmount?: number,
  ) => void;

  /** Analyze hidden costs for a set of events. */
  analyzeHiddenCosts: (
    events: CalendarEvent[],
    transactions: Transaction[],
    userId?: string,
  ) => Promise<void>;

  /** Dismiss a specific hidden cost by ID. */
  dismissHiddenCost: (costId: string) => void;

  /** Generate a daily brief for today. */
  generateDailyBrief: (context: {
    events: CalendarEvent[];
    budgets: Budget[];
  }) => void;

  /** Clear all predictions and reset state. */
  clear: () => void;
}

// ---- Store implementation ----

export const usePredictionStore = create<PredictionState>((set, get) => ({
  predictions: [],
  insight: null,
  isLoading: false,
  isPredicting: false,
  error: null,
  hiddenCosts: [],
  eventCostBreakdowns: {},
  dailyBrief: null,
  isAnalyzingHiddenCosts: false,

  fetchPredictions: (predictions) => {
    set({ predictions, isLoading: false, error: null });
  },

  generatePredictions: async (events, userId) => {
    set({ isPredicting: true, error: null });

    try {
      const newPredictions = await predictSpending(events, userId);

      // Merge: replace existing predictions for the same event, keep the rest.
      const existingMap = new Map(
        get().predictions.map((p) => [p.calendar_event_id, p]),
      );
      for (const p of newPredictions) {
        existingMap.set(p.calendar_event_id, p);
      }

      set({
        predictions: [...existingMap.values()],
        isPredicting: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Prediction failed';
      console.error('[PredictionStore] generatePredictions error:', error);
      set({ isPredicting: false, error: message });
    }
  },

  generateInsight: async (context) => {
    set({ isLoading: true, error: null });

    try {
      const result = await generateInsight({
        predictions: context?.predictions ?? get().predictions,
        transactions: context?.transactions as never[],
        budgets: context?.budgets as never[],
      });
      set({ insight: result, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Insight generation failed';
      console.error('[PredictionStore] generateInsight error:', error);
      set({ isLoading: false, error: message });
    }
  },

  submitFeedback: (predictionId, feedbackType, correctedCategory, correctedAmount) => {
    // Update the local prediction optimistically based on the feedback.
    set((state) => ({
      predictions: state.predictions.map((p) => {
        if (p.id !== predictionId) return p;

        return {
          ...p,
          predicted_category: correctedCategory ?? p.predicted_category,
          predicted_amount: correctedAmount ?? p.predicted_amount,
          // Mark as reviewed
          was_accurate: feedbackType === 'correct',
          actual_amount: correctedAmount ?? p.actual_amount,
        };
      }),
    }));

    // In a real implementation we would also persist the feedback to Supabase:
    // supabase.from('prediction_feedback').insert({ ... })
    console.log('[PredictionStore] Feedback submitted:', {
      predictionId,
      feedbackType,
      correctedCategory,
      correctedAmount,
    });
  },

  analyzeHiddenCosts: async (events, transactions, userId) => {
    set({ isAnalyzingHiddenCosts: true, error: null });

    try {
      const newHiddenCosts = await predictHiddenCosts(events, transactions, userId);
      const updatedCosts = [...get().hiddenCosts, ...newHiddenCosts];
      const breakdowns = buildEventCostBreakdowns(get().predictions, updatedCosts);

      set({
        hiddenCosts: updatedCosts,
        eventCostBreakdowns: breakdowns,
        isAnalyzingHiddenCosts: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hidden cost analysis failed';
      console.error('[PredictionStore] analyzeHiddenCosts error:', error);
      set({ isAnalyzingHiddenCosts: false, error: message });
    }
  },

  dismissHiddenCost: (costId) => {
    const updatedCosts = get().hiddenCosts.map(c =>
      c.id === costId ? { ...c, is_dismissed: true } : c,
    );
    const breakdowns = buildEventCostBreakdowns(get().predictions, updatedCosts);

    set({
      hiddenCosts: updatedCosts,
      eventCostBreakdowns: breakdowns,
    });
  },

  generateDailyBrief: (context) => {
    const brief = buildDailyBrief(
      context.events,
      get().predictions,
      get().hiddenCosts,
      context.budgets,
    );
    set({ dailyBrief: brief });
  },

  clear: () => {
    set({
      predictions: [],
      insight: null,
      isLoading: false,
      isPredicting: false,
      error: null,
      hiddenCosts: [],
      eventCostBreakdowns: {},
      dailyBrief: null,
      isAnalyzingHiddenCosts: false,
    });
  },
}));

// ---------- CCI & Accuracy calculation utilities ----------

/**
 * Calculate the Calendar Correlation Index (CCI).
 * CCI = hitRate * avgAccuracyWeight
 * where hitRate = predictions with actual_amount > 0 / total predictions
 * and accuracyWeight = 1 - |predicted - actual| / max(predicted, actual)
 *
 * @returns CCI value between 0 and 1
 */
export function calculateCCI(predictions: SpendingPrediction[]): number {
  if (predictions.length === 0) return 0;

  const hits = predictions.filter((p) => p.actual_amount != null && p.actual_amount > 0);
  if (hits.length === 0) return 0;

  const hitRate = hits.length / predictions.length;

  const totalAccuracy = hits.reduce((sum, p) => {
    const predicted = p.predicted_amount;
    const actual = p.actual_amount!;
    const maxVal = Math.max(predicted, actual);
    if (maxVal === 0) return sum + 1;
    const weight = 1 - Math.abs(predicted - actual) / maxVal;
    return sum + Math.max(0, weight);
  }, 0);

  const avgAccuracyWeight = totalAccuracy / hits.length;

  return Math.round(hitRate * avgAccuracyWeight * 1000) / 1000;
}

/**
 * Calculate CCI per category.
 * Groups predictions by predicted_category, computes CCI for each group.
 * Returns sorted descending by CCI.
 */
export function getCCIByCategory(predictions: SpendingPrediction[]): {
  category: string;
  cci: number;
}[] {
  const grouped: Record<string, SpendingPrediction[]> = {};

  for (const p of predictions) {
    const cat = p.predicted_category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  const result = Object.entries(grouped).map(([category, preds]) => ({
    category,
    cci: calculateCCI(preds),
  }));

  return result.sort((a, b) => b.cci - a.cci);
}

/**
 * Get recent prediction accuracy rows.
 * Returns the most recent N predictions with hit/miss indicators.
 */
export function getRecentPredictionAccuracy(
  predictions: SpendingPrediction[],
  limit: number = 10,
): {
  id: string;
  eventId: string;
  predictedAmount: number;
  actualAmount: number | null;
  category: string;
  accuracy: 'hit' | 'close' | 'miss' | 'pending';
}[] {
  const sorted = [...predictions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return sorted.slice(0, limit).map((p) => {
    let accuracy: 'hit' | 'close' | 'miss' | 'pending' = 'pending';

    if (p.actual_amount != null && p.actual_amount > 0) {
      const maxVal = Math.max(p.predicted_amount, p.actual_amount);
      const errorRate = maxVal > 0 ? Math.abs(p.predicted_amount - p.actual_amount) / maxVal : 0;

      if (errorRate <= 0.15) {
        accuracy = 'hit';
      } else if (errorRate <= 0.35) {
        accuracy = 'close';
      } else {
        accuracy = 'miss';
      }
    }

    return {
      id: p.id,
      eventId: p.calendar_event_id,
      predictedAmount: p.predicted_amount,
      actualAmount: p.actual_amount,
      category: p.predicted_category,
      accuracy,
    };
  });
}
