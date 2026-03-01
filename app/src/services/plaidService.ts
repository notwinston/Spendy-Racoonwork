import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Transaction,
  RecurringTransaction,
  PlaidConnection,
  Account,
  EventCategory,
  TransactionFrequency,
  DemoTransaction,
} from '../types';

// Bundled demo data
import sarahTransactions from '../data/sarah_transactions.json';
import marcusTransactions from '../data/marcus_transactions.json';

// ---------- Helpers ----------

function generateId(): string {
  return 'demo-' + Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

// ---------- Simulated Plaid Link ----------

export interface ConnectBankResult {
  connection: PlaidConnection;
  accounts: Account[];
}

/**
 * Simulate Plaid Link flow. In production this would open the Plaid Link
 * WebView and exchange the public token for an access token via a backend.
 * In demo/Expo Go mode, this returns a simulated connection.
 */
export async function connectBank(userId: string): Promise<ConnectBankResult> {
  const connectionId = generateId();
  const accountId = generateId();

  const connection: PlaidConnection = {
    id: connectionId,
    user_id: userId,
    plaid_item_id: `demo-item-${Date.now()}`,
    access_token_encrypted: 'demo-access-token',
    institution_name: 'Demo Bank (Simulated)',
    institution_id: 'demo_bank_001',
    status: 'active',
    last_sync_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const account: Account = {
    id: accountId,
    user_id: userId,
    plaid_connection_id: connectionId,
    plaid_account_id: `demo-account-${Date.now()}`,
    name: 'Chequing Account',
    official_name: 'Demo Everyday Chequing',
    type: 'depository',
    subtype: 'checking',
    current_balance: 2847.53,
    available_balance: 2647.53,
    currency: 'CAD',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error: connErr } = await supabase
      .from('plaid_connections')
      .insert({
        user_id: connection.user_id,
        plaid_item_id: connection.plaid_item_id,
        access_token_encrypted: connection.access_token_encrypted,
        institution_name: connection.institution_name,
        institution_id: connection.institution_id,
        status: connection.status,
      });
    if (connErr) console.warn('Supabase plaid_connections insert error:', connErr.message);

    const { error: acctErr } = await supabase
      .from('accounts')
      .insert({
        user_id: account.user_id,
        plaid_connection_id: connection.id,
        plaid_account_id: account.plaid_account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        current_balance: account.current_balance,
        available_balance: account.available_balance,
        currency: account.currency,
      });
    if (acctErr) console.warn('Supabase accounts insert error:', acctErr.message);
  }

  return { connection, accounts: [account] };
}

// ---------- Demo transaction loading ----------

/**
 * Load synthetic transaction data for the given user.
 */
export async function loadDemoTransactions(
  userId: string,
  persona: 'sarah' | 'marcus' = 'sarah',
): Promise<{ transactions: Transaction[]; account: Account; connection: PlaidConnection }> {
  // First create a simulated bank connection + account
  const { connection, accounts } = await connectBank(userId);
  const account = accounts[0];

  const rawTxns: DemoTransaction[] =
    persona === 'sarah'
      ? (sarahTransactions as DemoTransaction[])
      : (marcusTransactions as DemoTransaction[]);

  const transactions: Transaction[] = rawTxns.map((raw) => ({
    id: generateId(),
    user_id: userId,
    account_id: account.id,
    plaid_transaction_id: null,
    amount: raw.amount,
    currency: 'CAD',
    merchant_name: raw.merchant_name,
    category: raw.category as EventCategory,
    subcategory: null,
    date: raw.date,
    pending: false,
    is_recurring: raw.is_recurring,
    recurring_group_id: null,
    reviewed: false,
    notes: null,
    created_at: new Date().toISOString(),
  }));

  if (isSupabaseConfigured && transactions.length > 0) {
    const rows = transactions.map(({ id: _id, ...rest }) => rest);
    const { error } = await supabase.from('transactions').insert(rows);
    if (error) {
      console.warn('Supabase insert error (demo transactions):', error.message);
    }
  }

  return { transactions, account, connection };
}

// ---------- Recurring transaction detection ----------

interface TransactionGroup {
  merchant: string;
  category: EventCategory;
  amounts: number[];
  dates: string[];
}

/**
 * Detect recurring transaction patterns by grouping transactions by
 * merchant name and analyzing their frequency and amounts.
 */
export function detectRecurringTransactions(
  transactions: Transaction[],
  userId: string,
): RecurringTransaction[] {
  // Group by merchant
  const groups = new Map<string, TransactionGroup>();

  for (const txn of transactions) {
    const key = txn.merchant_name?.toLowerCase() ?? 'unknown';
    const existing = groups.get(key);
    if (existing) {
      existing.amounts.push(txn.amount);
      existing.dates.push(txn.date);
    } else {
      groups.set(key, {
        merchant: txn.merchant_name ?? 'Unknown',
        category: txn.category,
        amounts: [txn.amount],
        dates: [txn.date],
      });
    }
  }

  const recurring: RecurringTransaction[] = [];

  for (const [, group] of groups) {
    // Need at least 2 occurrences to detect a pattern
    if (group.amounts.length < 2) continue;

    const avgAmount =
      group.amounts.reduce((sum, a) => sum + a, 0) / group.amounts.length;

    // Check if amounts are consistent (within 20% of average)
    const amountVariance = group.amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount < 0.2,
    );

    if (!amountVariance && group.amounts.length < 3) continue;

    // Determine frequency from date gaps
    const sortedDates = [...group.dates].sort();
    const frequency = detectFrequency(sortedDates);
    if (!frequency) continue;

    // Calculate confidence based on consistency
    const occurrenceCount = group.amounts.length;
    const amountConsistency = amountVariance ? 0.3 : 0.1;
    const frequencyBonus = Math.min(occurrenceCount * 0.1, 0.5);
    const confidence = Math.min(amountConsistency + frequencyBonus + 0.2, 1.0);

    // Estimate next expected date
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const nextDate = estimateNextDate(lastDate, frequency);

    recurring.push({
      id: generateId(),
      user_id: userId,
      merchant_name: group.merchant,
      category: group.category,
      avg_amount: Math.round(avgAmount * 100) / 100,
      frequency,
      next_expected_date: nextDate.toISOString().split('T')[0],
      last_occurrence: sortedDates[sortedDates.length - 1],
      confidence: Math.round(confidence * 100) / 100,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }

  return recurring;
}

function detectFrequency(sortedDates: string[]): TransactionFrequency | null {
  if (sortedDates.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]).getTime();
    const curr = new Date(sortedDates[i]).getTime();
    gaps.push((curr - prev) / (1000 * 60 * 60 * 24)); // days
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

  if (avgGap <= 10) return 'weekly';
  if (avgGap <= 21) return 'biweekly';
  if (avgGap <= 45) return 'monthly';
  if (avgGap <= 120) return 'quarterly';
  if (avgGap <= 400) return 'yearly';

  return null;
}

function estimateNextDate(lastDate: Date, frequency: TransactionFrequency): Date {
  const next = new Date(lastDate);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// ---------- Placeholder for real Plaid sync ----------

/**
 * In production, this would call the Plaid Transactions API via a
 * backend endpoint. Currently a no-op placeholder.
 */
export async function syncTransactions(
  _connectionId: string,
): Promise<Transaction[]> {
  console.warn(
    'syncTransactions: This is a placeholder. ' +
    'In production, implement Plaid Transactions API sync via your backend.',
  );
  return [];
}
