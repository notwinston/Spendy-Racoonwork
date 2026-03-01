import { create } from 'zustand';
import type {
  CalendarEvent,
  SpendingPrediction,
  FeedbackType,
  EventCategory,
} from '../types';
import { predictSpending, generateInsight } from '../services/predictionService';

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

  clear: () => {
    set({
      predictions: [],
      insight: null,
      isLoading: false,
      isPredicting: false,
      error: null,
    });
  },
}));
