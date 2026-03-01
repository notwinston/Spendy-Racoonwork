import { create } from 'zustand';
import { supabase, isDemoMode } from '../lib/supabase';
import type { Budget, EventCategory, Transaction } from '../types';

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
): number {
  // Weighted composite score 0-100
  const burnScore = Math.max(0, Math.min(100, (1 - Math.abs(1 - burnRate)) * 100));
  const adherenceScore = budgetAdherence;
  const streakScore = Math.min(100, streakDays * 5);
  const savingsScore = Math.min(100, savingsRate * 200);

  return Math.round(
    burnScore * 0.35 +
    adherenceScore * 0.30 +
    streakScore * 0.15 +
    savingsScore * 0.20
  );
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
