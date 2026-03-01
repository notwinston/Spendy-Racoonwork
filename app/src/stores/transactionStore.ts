import { create } from 'zustand';
import type {
  Transaction,
  RecurringTransaction,
  PlaidConnection,
  Account,
  ParsedReceipt,
} from '../types';
import {
  connectBank as connectBankService,
  loadDemoTransactions,
  detectRecurringTransactions,
  syncTransactions,
} from '../services/plaidService';
import { createTransactionFromReceipt } from '../services/receiptService';
import { supabase, isSupabaseConfigured, isDemoMode } from '../lib/supabase';

interface TransactionState {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  plaidConnections: PlaidConnection[];
  accounts: Account[];
  isLoading: boolean;

  // Actions
  fetchTransactions: (userId: string) => Promise<void>;
  connectBank: (userId: string) => Promise<void>;
  loadDemoData: (userId: string, persona?: 'sarah' | 'marcus') => Promise<void>;
  createFromReceipt: (
    userId: string,
    accountId: string,
    receipt: ParsedReceipt,
  ) => Promise<void>;
  detectRecurring: (userId: string) => void;
  syncBankTransactions: (connectionId: string) => Promise<void>;
  updateTransaction: (txnId: string, updates: Partial<Transaction>) => Promise<void>;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  recurringTransactions: [],
  plaidConnections: [],
  accounts: [],
  isLoading: false,

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) {
          console.warn('Error fetching transactions:', error.message);
        } else if (data) {
          set({ transactions: data as Transaction[] });
        }

        // Also fetch recurring
        const { data: recurringData, error: recurringErr } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', userId);

        if (recurringErr) {
          console.warn('Error fetching recurring:', recurringErr.message);
        } else if (recurringData) {
          set({ recurringTransactions: recurringData as RecurringTransaction[] });
        }
      }
    } catch (err) {
      console.warn('fetchTransactions error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  connectBank: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { connection, accounts } = await connectBankService(userId);
      set({
        plaidConnections: [...get().plaidConnections, connection],
        accounts: [...get().accounts, ...accounts],
      });
    } catch (err) {
      console.warn('connectBank error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  loadDemoData: async (userId: string, persona?: 'sarah' | 'marcus') => {
    set({ isLoading: true });
    try {
      const { transactions, account, connection } =
        await loadDemoTransactions(userId, persona);
      set({
        transactions,
        plaidConnections: [...get().plaidConnections, connection],
        accounts: [...get().accounts, account],
      });

      // Auto-detect recurring patterns
      const recurring = detectRecurringTransactions(transactions, userId);
      set({ recurringTransactions: recurring });

      // Persist recurring to Supabase if configured
      if (isSupabaseConfigured && !isDemoMode() && recurring.length > 0) {
        try {
          const rows = recurring.map(({ id: _id, ...rest }) => rest);
          await supabase.from('recurring_transactions').insert(rows);
        } catch { /* tables may not exist yet */ }
      }
    } catch (err) {
      console.warn('loadDemoData error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createFromReceipt: async (
    userId: string,
    accountId: string,
    receipt: ParsedReceipt,
  ) => {
    set({ isLoading: true });
    try {
      const newTransaction = await createTransactionFromReceipt(
        userId,
        accountId,
        receipt,
      );
      set({ transactions: [newTransaction, ...get().transactions] });
    } catch (err) {
      console.warn('createFromReceipt error:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  detectRecurring: (userId: string) => {
    const { transactions } = get();
    const recurring = detectRecurringTransactions(transactions, userId);
    set({ recurringTransactions: recurring });
  },

  syncBankTransactions: async (connectionId: string) => {
    set({ isLoading: true });
    try {
      const newTxns = await syncTransactions(connectionId);
      if (newTxns.length > 0) {
        set({ transactions: [...newTxns, ...get().transactions] });
      }
    } catch (err) {
      console.warn('syncBankTransactions error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateTransaction: async (txnId: string, updates: Partial<Transaction>) => {
    const { transactions } = get();
    const updated = transactions.map((t) =>
      t.id === txnId ? { ...t, ...updates } : t
    );
    set({ transactions: updated });

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', txnId);
      if (error) {
        console.warn('updateTransaction error:', error.message);
      }
    }
  },

  clearTransactions: () =>
    set({
      transactions: [],
      recurringTransactions: [],
      plaidConnections: [],
      accounts: [],
    }),
}));

// ---------- Calculation utilities ----------

/**
 * Calculate spending velocity: average daily spending over the last 7 days ($/day).
 */
export function calculateSpendingVelocity(transactions: Transaction[]): number {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSpending = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d >= sevenDaysAgo && d <= now;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return Math.round((recentSpending / 7) * 100) / 100;
}

/**
 * Calculate velocity trend: percentage change between this week and last week velocity.
 */
export function calculateVelocityTrend(transactions: Transaction[]): number {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekSpending = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d >= sevenDaysAgo && d <= now;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastWeekSpending = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const thisWeekVelocity = thisWeekSpending / 7;
  const lastWeekVelocity = lastWeekSpending / 7;

  if (lastWeekVelocity === 0) return 0;
  return Math.round(((thisWeekVelocity - lastWeekVelocity) / lastWeekVelocity) * 10000) / 100;
}

/**
 * Get month-over-month category comparison.
 * Returns array of { category, thisMonth, lastMonth, changePercent }.
 */
export function getCategoryMoM(transactions: Transaction[], referenceDate?: Date): {
  category: string;
  thisMonth: number;
  lastMonth: number;
  changePercent: number;
}[] {
  const now = referenceDate ?? new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const today = new Date();
  const isCurrentMonth = now.getFullYear() === today.getFullYear() && now.getMonth() === today.getMonth();
  const thisMonthEnd = isCurrentMonth ? today : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const thisMonthMap: Record<string, number> = {};
  const lastMonthMap: Record<string, number> = {};

  for (const t of transactions) {
    const d = new Date(t.date);
    const amount = Math.abs(t.amount);

    if (d >= thisMonthStart && d <= thisMonthEnd) {
      thisMonthMap[t.category] = (thisMonthMap[t.category] || 0) + amount;
    } else if (d >= lastMonthStart && d <= lastMonthEnd) {
      lastMonthMap[t.category] = (lastMonthMap[t.category] || 0) + amount;
    }
  }

  const allCategories = new Set([...Object.keys(thisMonthMap), ...Object.keys(lastMonthMap)]);

  const result = Array.from(allCategories).map((category) => {
    const thisMonth = Math.round((thisMonthMap[category] || 0) * 100) / 100;
    const lastMonth = Math.round((lastMonthMap[category] || 0) * 100) / 100;
    const changePercent = lastMonth === 0
      ? (thisMonth > 0 ? 100 : 0)
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 10000) / 100;

    return { category, thisMonth, lastMonth, changePercent };
  });

  return result.sort((a, b) => b.thisMonth - a.thisMonth);
}

/**
 * Get monthly spending totals for the last N months.
 */
export function getMonthlyTotals(
  transactions: Transaction[],
  months: number = 6,
  referenceDate?: Date,
): { label: string; value: number }[] {
  const now = referenceDate ?? new Date();
  const result: { label: string; value: number }[] = [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const total = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d >= monthDate && d <= monthEnd;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    result.push({
      label: monthNames[monthDate.getMonth()],
      value: Math.round(total * 100) / 100,
    });
  }

  return result;
}
