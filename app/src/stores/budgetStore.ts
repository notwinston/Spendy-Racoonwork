import { create } from 'zustand';
import { supabase, isDemoMode } from '../lib/supabase';
import type { Budget, EventCategory, Transaction, SpendingPrediction, RecurringTransaction, SavingsGoal } from '../types';

interface CategoryBudget extends Budget {
  spent: number;
  predicted: number;
  remaining: number;
  percentUsed: number;
}

interface BudgetState {
  totalBudget: number;
  totalSpent: number;
  totalPredicted: number;
  budgets: CategoryBudget[];
  isLoading: boolean;

  // Goal state
  goals: SavingsGoal[];
  goalAdd: (goal: Omit<SavingsGoal, 'id'>) => void;
  goalUpdate: (id: string, updates: Partial<SavingsGoal>) => void;
  goalDelete: (id: string) => void;
  goalReorder: (id: string, direction: 'up' | 'down') => void;

  fetchBudgets: (userId: string) => Promise<void>;
  createBudget: (userId: string, category: EventCategory, monthlyLimit: number) => Promise<void>;
  updateBudget: (budgetId: string, monthlyLimit: number) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  computeFromTransactions: (transactions: Transaction[], predictions?: { category: EventCategory; predicted_amount: number }[]) => void;
}

const DEFAULT_BUDGETS: { category: EventCategory; limit: number }[] = [
  { category: 'dining', limit: 300 },
  { category: 'groceries', limit: 400 },
  { category: 'transport', limit: 150 },
  { category: 'entertainment', limit: 200 },
  { category: 'shopping', limit: 250 },
  { category: 'health', limit: 100 },
  { category: 'fitness', limit: 80 },
  { category: 'bills', limit: 500 },
];

function makeDefaultBudgets(userId: string): CategoryBudget[] {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  return DEFAULT_BUDGETS.map((b) => ({
    id: `demo-${b.category}`,
    user_id: userId,
    category: b.category,
    monthly_limit: b.limit,
    period_start: periodStart,
    period_end: periodEnd,
    created_at: now.toISOString(),
    spent: 0,
    predicted: 0,
    remaining: b.limit,
    percentUsed: 0,
  }));
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  totalBudget: 1980,
  totalSpent: 0,
  totalPredicted: 0,
  budgets: [],
  isLoading: false,

  // Goal state
  goals: [],

  goalAdd: (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    set((state) => ({ goals: [...state.goals, newGoal] }));
  },

  goalUpdate: (id: string, updates: Partial<SavingsGoal>) => {
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  goalDelete: (id: string) => {
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  goalReorder: (id: string, direction: 'up' | 'down') => {
    set((state) => {
      const goals = [...state.goals];
      const idx = goals.findIndex((g) => g.id === id);
      if (idx < 0) return state;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= goals.length) return state;
      [goals[idx], goals[swapIdx]] = [goals[swapIdx], goals[idx]];
      return { goals };
    });
  },

  fetchBudgets: async (userId: string) => {
    set({ isLoading: true });
    try {
      if (isDemoMode()) {
        set({ budgets: makeDefaultBudgets(userId), isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('category');

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ budgets: makeDefaultBudgets(userId), isLoading: false });
        return;
      }

      const budgets: CategoryBudget[] = data.map((b: Budget) => ({
        ...b,
        spent: 0,
        predicted: 0,
        remaining: b.monthly_limit,
        percentUsed: 0,
      }));

      set({ budgets, isLoading: false });
    } catch {
      set({ budgets: makeDefaultBudgets(userId), isLoading: false });
    }
  },

  createBudget: async (userId: string, category: EventCategory, monthlyLimit: number) => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const newBudget: CategoryBudget = {
      id: `budget-${Date.now()}`,
      user_id: userId,
      category,
      monthly_limit: monthlyLimit,
      period_start: periodStart,
      period_end: periodEnd,
      created_at: now.toISOString(),
      spent: 0,
      predicted: 0,
      remaining: monthlyLimit,
      percentUsed: 0,
    };

    if (!isDemoMode()) {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category,
          monthly_limit: monthlyLimit,
          period_start: periodStart,
          period_end: periodEnd,
        })
        .select()
        .single();

      if (!error && data) {
        newBudget.id = data.id;
      }
    }

    set((state) => ({ budgets: [...state.budgets, newBudget] }));
  },

  updateBudget: async (budgetId: string, monthlyLimit: number) => {
    if (!isDemoMode()) {
      await supabase.from('budgets').update({ monthly_limit: monthlyLimit }).eq('id', budgetId);
    }

    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === budgetId
          ? { ...b, monthly_limit: monthlyLimit, remaining: monthlyLimit - b.spent, percentUsed: (b.spent / monthlyLimit) * 100 }
          : b,
      ),
    }));
  },

  deleteBudget: async (budgetId: string) => {
    if (!isDemoMode()) {
      await supabase.from('budgets').delete().eq('id', budgetId);
    }

    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== budgetId),
    }));
  },

  computeFromTransactions: (
    transactions: Transaction[],
    predictions?: { category: EventCategory; predicted_amount: number }[],
  ) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter to current month
    const monthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart;
    });

    // Sum spent per category
    const spentByCategory: Partial<Record<EventCategory, number>> = {};
    let totalSpent = 0;
    for (const t of monthTxns) {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(t.amount);
      totalSpent += Math.abs(t.amount);
    }

    // Sum predicted per category
    const predictedByCategory: Partial<Record<EventCategory, number>> = {};
    let totalPredicted = 0;
    if (predictions) {
      for (const p of predictions) {
        predictedByCategory[p.category] = (predictedByCategory[p.category] || 0) + p.predicted_amount;
        totalPredicted += p.predicted_amount;
      }
    }

    set((state) => {
      const totalBudget = state.budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
      const updatedBudgets = state.budgets.map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const predicted = predictedByCategory[b.category] || 0;
        const remaining = Math.max(0, b.monthly_limit - spent);
        const percentUsed = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
        return { ...b, spent, predicted, remaining, percentUsed };
      });

      return {
        budgets: updatedBudgets,
        totalBudget,
        totalSpent,
        totalPredicted,
      };
    });
  },
}));

// Financial metric calculations
export function calculateBurnRate(spent: number, budget: number, dayOfMonth: number, daysInMonth: number): number {
  if (budget === 0 || dayOfMonth === 0) return 0;
  const expectedSpent = (budget / daysInMonth) * dayOfMonth;
  return expectedSpent > 0 ? spent / expectedSpent : 0;
}

export function getBurnRateColor(rate: number): string {
  const { Colors } = require('../constants');
  if (rate <= 0.8) return Colors.burnExcellent;
  if (rate <= 1.0) return Colors.burnOnTrack;
  if (rate <= 1.2) return Colors.burnCaution;
  return Colors.burnOver;
}

export function calculateHealthScore(
  burnRate: number,
  budgetAdherence: number, // % of categories under budget
  streakDays: number,
  savingsRate: number, // fraction saved
  cciScore?: number,             // 0-100, optional v2 param
  hiddenCostAwareness?: number,  // 0-1, optional v2 param
): number {
  const burnScore = Math.max(0, Math.min(100, (1 - Math.abs(1 - burnRate)) * 100));
  const adherenceScore = budgetAdherence;
  const streakScore = Math.min(100, streakDays * 5);
  const savingsScore = Math.min(100, savingsRate * 200);

  // v2 formula when CCI and hiddenCostAwareness are available
  if (cciScore !== undefined && hiddenCostAwareness !== undefined) {
    const awarenessScore = hiddenCostAwareness * 100;
    return Math.round(
      burnScore * 0.25 +
      adherenceScore * 0.20 +
      cciScore * 0.20 +
      savingsScore * 0.15 +
      streakScore * 0.10 +
      awarenessScore * 0.10
    );
  }

  // Legacy 4-component formula
  return Math.round(
    burnScore * 0.35 +
    adherenceScore * 0.30 +
    streakScore * 0.15 +
    savingsScore * 0.20
  );
}

/**
 * 5-component health score formula matching MVP.md Section 5.8.
 * Weights: 0.30 BudgetAdherence + 0.25 SavingsRate + 0.20 SpendingStability
 *        + 0.15 CalendarCorrelation + 0.10 StreakBonus
 */
export function calculateHealthScoreV2(
  budgetAdherence: number,    // 0-100
  savingsRate: number,        // 0-100
  spendingStability: number,  // 0-100
  calendarCorrelation: number, // 0-100
  streakDays: number,
): number {
  const streakBonus = Math.min(100, streakDays * 3.33);

  return Math.round(
    budgetAdherence * 0.30 +
    savingsRate * 0.25 +
    spendingStability * 0.20 +
    calendarCorrelation * 0.15 +
    streakBonus * 0.10
  );
}

/**
 * Calculate spending stability from transaction data.
 * Computes coefficient of variation across daily spending amounts over the last 30 days.
 * Lower CV = more stable spending = higher score.
 * Returns 0-100.
 */
export function calculateSpendingStability(transactions: Transaction[], referenceDate?: Date): number {
  const now = referenceDate ?? new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter to last 30 days, only spending (negative or absolute amounts)
  const recentTxns = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= thirtyDaysAgo && d <= now;
  });

  if (recentTxns.length < 2) return 50; // Not enough data, return neutral score

  // Aggregate daily spending
  const dailySpending: Record<string, number> = {};
  for (const t of recentTxns) {
    const dateKey = t.date.split('T')[0];
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + Math.abs(t.amount);
  }

  const dailyValues = Object.values(dailySpending);
  if (dailyValues.length < 2) return 50;

  const mean = dailyValues.reduce((sum, v) => sum + v, 0) / dailyValues.length;
  if (mean === 0) return 100;

  const variance = dailyValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / dailyValues.length;
  const std = Math.sqrt(variance);
  const cv = std / mean;

  return Math.max(0, Math.round(100 - cv * 100));
}

/**
 * Budget adherence using the MVP formula:
 * max(0, 1 - |totalSpent - monthlyBudget| / monthlyBudget) * 100
 */
export function calculateBudgetAdherenceMVP(totalSpent: number, monthlyBudget: number): number {
  if (monthlyBudget <= 0) return 0;
  return Math.max(0, (1 - Math.abs(totalSpent - monthlyBudget) / monthlyBudget)) * 100;
}

export function getHealthGrade(score: number): { grade: string; color: string } {
  const { Colors } = require('../constants');
  if (score >= 90) return { grade: 'A+', color: Colors.gradeAPlus };
  if (score >= 80) return { grade: 'A', color: Colors.gradeA };
  if (score >= 70) return { grade: 'B', color: Colors.gradeB };
  if (score >= 60) return { grade: 'C', color: Colors.gradeC };
  if (score >= 50) return { grade: 'D', color: Colors.gradeD };
  return { grade: 'F', color: Colors.gradeF };
}

/**
 * Calendar Correlation Index (CCI): measures how well predictions match actual spending.
 * Matches predictions to transactions by category + date proximity (same day ± 1 day).
 */
export function calculateCCI(
  predictions: SpendingPrediction[],
  transactions: Transaction[],
): { score: number; label: string; perCategory: Record<string, number> } {
  if (predictions.length === 0 || transactions.length === 0) {
    return { score: 0, label: 'No data', perCategory: {} };
  }

  const perCategory: Record<string, { totalWeight: number; count: number }> = {};
  let totalWeight = 0;
  let matched = 0;

  for (const pred of predictions) {
    const predDate = new Date(pred.created_at);

    // Find transactions matching by category and date proximity (±1 day)
    const matchingTxns = transactions.filter((t) => {
      if (t.category !== pred.predicted_category) return false;
      const txnDate = new Date(t.date);
      const diffMs = Math.abs(txnDate.getTime() - predDate.getTime());
      return diffMs <= 2 * 24 * 60 * 60 * 1000; // ±1 day tolerance
    });

    if (matchingTxns.length === 0) continue;

    const actual = matchingTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
    const predicted = pred.predicted_amount;
    const maxVal = Math.max(predicted, actual);
    const weight = maxVal > 0 ? Math.max(0, 1 - Math.abs(predicted - actual) / maxVal) : 1;

    totalWeight += weight;
    matched++;

    const cat = pred.predicted_category;
    if (!perCategory[cat]) perCategory[cat] = { totalWeight: 0, count: 0 };
    perCategory[cat].totalWeight += weight;
    perCategory[cat].count++;
  }

  if (matched === 0) return { score: 0, label: 'No matches', perCategory: {} };

  const hitRate = matched / predictions.length;
  const avgWeight = totalWeight / matched;
  const score = Math.round(hitRate * avgWeight * 100);

  const perCatScores: Record<string, number> = {};
  for (const [cat, data] of Object.entries(perCategory)) {
    perCatScores[cat] = Math.round((data.totalWeight / data.count) * 100);
  }

  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak';

  return { score, label, perCategory: perCatScores };
}

/**
 * Spending Velocity: daily spending rate vs budget pace.
 */
export function calculateSpendingVelocity(
  transactions: Transaction[],
): { daily: number; budgetPace: number; ratio: number } {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentTxns = transactions.filter((t) => new Date(t.date) >= sevenDaysAgo);
  const totalRecent = recentTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const daily = totalRecent / 7;

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // Use a default monthly budget estimate from recent spending pattern
  const monthlyEstimate = daily * daysInMonth;
  const budgetPace = monthlyEstimate / daysInMonth;

  const ratio = budgetPace > 0 ? daily / budgetPace : 0;

  return { daily, budgetPace, ratio: ratio || 1 };
}

/**
 * Surprise Spend Ratio: (total - predicted - recurring) / total.
 * Lower is better (0-1).
 */
export function calculateSurpriseSpendRatio(
  transactions: Transaction[],
  predictions: SpendingPrediction[],
  recurringTransactions: RecurringTransaction[],
): number {
  if (transactions.length === 0) return 0;

  const total = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  if (total === 0) return 0;

  const predicted = predictions.reduce((s, p) => s + p.predicted_amount, 0);
  const recurring = recurringTransactions
    .filter((r) => r.is_active)
    .reduce((s, r) => s + r.avg_amount, 0);

  const surprise = Math.max(0, total - predicted - recurring);
  return Math.min(1, surprise / total);
}

/**
 * Event Cost Variance: per-category coefficient of variation.
 */
export function calculateEventCostVariance(
  transactions: Transaction[],
  predictions: SpendingPrediction[],
): Record<string, { mean: number; stddev: number; cv: number; rating: 'low' | 'medium' | 'high' }> {
  // Group transaction amounts by category
  const byCategory: Record<string, number[]> = {};

  for (const t of transactions) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(Math.abs(t.amount));
  }

  // Also include prediction amounts
  for (const p of predictions) {
    const cat = p.predicted_category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p.predicted_amount);
  }

  const result: Record<string, { mean: number; stddev: number; cv: number; rating: 'low' | 'medium' | 'high' }> = {};

  for (const [cat, amounts] of Object.entries(byCategory)) {
    if (amounts.length < 2) {
      result[cat] = { mean: amounts[0] ?? 0, stddev: 0, cv: 0, rating: 'low' };
      continue;
    }

    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (mean === 0) {
      result[cat] = { mean: 0, stddev: 0, cv: 0, rating: 'low' };
      continue;
    }

    const variance = amounts.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / amounts.length;
    const stddev = Math.sqrt(variance);
    const cv = stddev / mean;

    const rating: 'low' | 'medium' | 'high' = cv < 0.2 ? 'low' : cv <= 0.5 ? 'medium' : 'high';

    result[cat] = {
      mean: Math.round(mean * 100) / 100,
      stddev: Math.round(stddev * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      rating,
    };
  }

  return result;
}

// ---------- Predictive utilities (Wave 2a) ----------

/**
 * Suggest category budgets by comparing 3-month average spending
 * to current budget allocation.
 */
export function suggestCategoryBudgets(
  transactions: Transaction[],
  budgets: Array<{ category: EventCategory; monthly_limit: number }>,
  referenceDate?: Date,
): Array<{ category: string; currentBudget: number; suggestedBudget: number; reason: string }> {
  const now = referenceDate ?? new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Calculate 3-month average per category
  const spendByCategory: Record<string, number> = {};
  const txnCount: Record<string, number> = {};

  for (const t of transactions) {
    const d = new Date(t.date);
    if (d >= threeMonthsAgo && d <= now) {
      const cat = t.category;
      spendByCategory[cat] = (spendByCategory[cat] || 0) + Math.abs(t.amount);
      txnCount[cat] = (txnCount[cat] || 0) + 1;
    }
  }

  const suggestions: Array<{
    category: string;
    currentBudget: number;
    suggestedBudget: number;
    reason: string;
  }> = [];

  for (const budget of budgets) {
    const cat = budget.category;
    const totalSpend = spendByCategory[cat] || 0;
    const monthlyAvg = Math.round(totalSpend / 3);
    const currentBudget = budget.monthly_limit;

    // Only suggest if there's meaningful difference (>15%)
    const diff = Math.abs(monthlyAvg - currentBudget);
    const pctDiff = currentBudget > 0 ? (diff / currentBudget) * 100 : 0;

    if (pctDiff > 15 && monthlyAvg > 0) {
      // Add 10% buffer to average
      const suggested = Math.round(monthlyAvg * 1.1);
      const reason =
        monthlyAvg > currentBudget
          ? `Your 3-month average ($${monthlyAvg}) exceeds your budget by ${Math.round(pctDiff)}%.`
          : `Your 3-month average ($${monthlyAvg}) is ${Math.round(pctDiff)}% below your budget. Consider reallocating.`;

      suggestions.push({
        category: cat,
        currentBudget,
        suggestedBudget: suggested,
        reason,
      });
    }
  }

  return suggestions.sort(
    (a, b) => Math.abs(b.suggestedBudget - b.currentBudget) - Math.abs(a.suggestedBudget - a.currentBudget),
  );
}

/**
 * Predict when a savings goal will be achieved based on current contribution rate.
 */
export function predictGoalAchievement(
  goalTarget: number,
  currentSaved: number,
  monthlyContribution: number,
): { monthsToGoal: number; estimatedDate: string } {
  if (monthlyContribution <= 0) {
    return { monthsToGoal: Infinity, estimatedDate: 'Never at current rate' };
  }

  const remaining = goalTarget - currentSaved;
  if (remaining <= 0) {
    return { monthsToGoal: 0, estimatedDate: 'Already achieved!' };
  }

  const monthsToGoal = Math.ceil(remaining / monthlyContribution);

  const estimatedDate = new Date();
  estimatedDate.setMonth(estimatedDate.getMonth() + monthsToGoal);
  const dateStr = estimatedDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return { monthsToGoal, estimatedDate: dateStr };
}
