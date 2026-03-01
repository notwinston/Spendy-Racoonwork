import { create } from 'zustand';
import type {
  Transaction,
  RecurringTransaction,
  PlaidConnection,
  Account,
} from '../types';
import {
  connectBank as connectBankService,
  loadDemoTransactions,
  detectRecurringTransactions,
  syncTransactions,
} from '../services/plaidService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  detectRecurring: (userId: string) => void;
  syncBankTransactions: (connectionId: string) => Promise<void>;
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
      if (isSupabaseConfigured && recurring.length > 0) {
        const rows = recurring.map(({ id: _id, ...rest }) => rest);
        const { error } = await supabase
          .from('recurring_transactions')
          .insert(rows);
        if (error) {
          console.warn('Supabase recurring insert error:', error.message);
        }
      }
    } catch (err) {
      console.warn('loadDemoData error:', err);
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

  clearTransactions: () =>
    set({
      transactions: [],
      recurringTransactions: [],
      plaidConnections: [],
      accounts: [],
    }),
}));
