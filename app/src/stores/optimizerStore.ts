import { create } from 'zustand';
import type {
  FinancialProfile,
  FixedBill,
  OptimizerInsight,
  IncomeFrequency,
  Transaction,
  RecurringTransaction,
  SpendingPrediction,
  SavingsGoal,
} from '../types';

// ---------- Helpers ----------

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / msPerDay);
}

function getNextPayDate(current: string, frequency: IncomeFrequency): Date {
  const d = new Date(current);
  switch (frequency) {
    case 'weekly':
      return addDays(d, 7);
    case 'biweekly':
      return addDays(d, 14);
    case 'monthly': {
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
  }
}

function incomeInHorizon(
  profile: FinancialProfile,
  horizonStart: Date,
  horizonEnd: Date,
): number {
  let total = 0;
  let payDate = new Date(profile.nextPayDate);
  // Walk forward pay dates up to 6 months to cover any horizon
  for (let i = 0; i < 26; i++) {
    if (payDate > horizonEnd) break;
    if (payDate >= horizonStart) {
      total += profile.incomeAmount;
    }
    payDate = getNextPayDate(payDate.toISOString().split('T')[0], profile.incomeFrequency);
  }
  return total;
}

function daysUntilNextPay(profile: FinancialProfile): number {
  const now = startOfDay(new Date());
  let payDate = new Date(profile.nextPayDate);
  // Find the next pay date that's today or later
  while (payDate < now) {
    payDate = getNextPayDate(payDate.toISOString().split('T')[0], profile.incomeFrequency);
  }
  return daysBetween(now, payDate);
}

// ---------- Spendable Computation ----------

export interface SpendableResult {
  amount: number;
  label: string;
  horizon: 'today' | 'this_week' | 'next_paycheck';
  incomeInPeriod: number;
  spentInPeriod: number;
  predictedInPeriod: number;
  billsInPeriod: number;
  savingsInPeriod: number;
  bufferAmount: number;
}

function computeSpendable(
  profile: FinancialProfile,
  transactions: Transaction[],
  predictions: SpendingPrediction[],
  goals: SavingsGoal[],
  horizon: 'today' | 'this_week' | 'next_paycheck',
): SpendableResult {
  const now = new Date();
  const today = startOfDay(now);

  let horizonStart: Date;
  let horizonEnd: Date;
  let label: string;

  switch (horizon) {
    case 'today':
      horizonStart = today;
      horizonEnd = addDays(today, 1);
      label = 'Today';
      break;
    case 'this_week': {
      horizonStart = today;
      horizonEnd = addDays(today, 7);
      label = 'This Week';
      break;
    }
    case 'next_paycheck': {
      horizonStart = today;
      const daysUntil = daysUntilNextPay(profile);
      horizonEnd = addDays(today, Math.max(daysUntil, 1));
      label = `Until Payday (${daysUntil}d)`;
      break;
    }
  }

  const horizonDays = Math.max(1, daysBetween(horizonStart, horizonEnd));

  // Income arriving in this period
  const income = incomeInHorizon(profile, horizonStart, horizonEnd);

  // Already spent in this horizon window
  const spentInPeriod = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d >= horizonStart && d < horizonEnd;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Predicted expenses (from prediction store) falling in horizon
  const predictedInPeriod = predictions
    .filter((p) => {
      const d = new Date(p.created_at);
      return d >= horizonStart && d < horizonEnd;
    })
    .reduce((sum, p) => sum + p.predicted_amount, 0);

  // Fixed bills due in horizon
  const billsInPeriod = profile.fixedBills.reduce((sum, bill) => {
    const billDate = new Date(today.getFullYear(), today.getMonth(), bill.dayOfMonth);
    if (billDate >= horizonStart && billDate < horizonEnd) {
      return sum + bill.amount;
    }
    // Also check next month if horizon crosses month boundary
    const nextMonthBill = new Date(today.getFullYear(), today.getMonth() + 1, bill.dayOfMonth);
    if (nextMonthBill >= horizonStart && nextMonthBill < horizonEnd) {
      return sum + bill.amount;
    }
    return sum;
  }, 0);

  // Savings contributions prorated to horizon
  const monthlyContributions = goals
    .filter((g) => !g.isPaused)
    .reduce((sum, g) => sum + g.monthlyContribution, 0);
  const savingsInPeriod = (monthlyContributions / 30) * horizonDays;

  // Safety buffer prorated
  const monthlyIncome = profile.incomeAmount * (
    profile.incomeFrequency === 'weekly' ? 4.33 :
    profile.incomeFrequency === 'biweekly' ? 2.17 : 1
  );
  const monthlyBuffer = monthlyIncome * (profile.safetyBufferPercent / 100);
  const bufferAmount = (monthlyBuffer / 30) * horizonDays;

  const amount = Math.max(
    0,
    income - spentInPeriod - predictedInPeriod - billsInPeriod - savingsInPeriod - bufferAmount,
  );

  return {
    amount: Math.round(amount * 100) / 100,
    label,
    horizon,
    incomeInPeriod: Math.round(income * 100) / 100,
    spentInPeriod: Math.round(spentInPeriod * 100) / 100,
    predictedInPeriod: Math.round(predictedInPeriod * 100) / 100,
    billsInPeriod: Math.round(billsInPeriod * 100) / 100,
    savingsInPeriod: Math.round(savingsInPeriod * 100) / 100,
    bufferAmount: Math.round(bufferAmount * 100) / 100,
  };
}

// ---------- Insight Generation ----------

function generateInsights(
  profile: FinancialProfile,
  spendables: SpendableResult[],
  transactions: Transaction[],
  recurringTransactions: RecurringTransaction[],
): OptimizerInsight[] {
  const insights: OptimizerInsight[] = [];
  const todaySpendable = spendables.find((s) => s.horizon === 'today');
  const weekSpendable = spendables.find((s) => s.horizon === 'this_week');
  const paycheckSpendable = spendables.find((s) => s.horizon === 'next_paycheck');

  // Tight budget warning
  if (todaySpendable && todaySpendable.amount < 20) {
    insights.push({
      id: 'opt-tight-today',
      type: 'warning',
      title: 'Tight Budget Today',
      body: `You have $${todaySpendable.amount.toFixed(0)} to spend today. Consider postponing non-essential purchases.`,
      priority: 1,
      dollarImpact: null,
    });
  }

  // Bills coming up
  if (paycheckSpendable && paycheckSpendable.billsInPeriod > 0) {
    insights.push({
      id: 'opt-bills-upcoming',
      type: 'budget',
      title: 'Bills Before Payday',
      body: `$${paycheckSpendable.billsInPeriod.toFixed(0)} in bills due before your next paycheck.`,
      priority: 2,
      dollarImpact: paycheckSpendable.billsInPeriod,
    });
  }

  // Subscription savings opportunity
  const monthlySubscriptions = recurringTransactions
    .filter((r) => r.is_active && r.frequency === 'monthly')
    .reduce((sum, r) => sum + r.avg_amount, 0);
  if (monthlySubscriptions > 100) {
    insights.push({
      id: 'opt-subscriptions',
      type: 'opportunity',
      title: 'Subscription Review',
      body: `You spend $${monthlySubscriptions.toFixed(0)}/month on subscriptions. Reviewing these could free up spending power.`,
      priority: 3,
      dollarImpact: monthlySubscriptions * 0.3,
    });
  }

  // Positive: comfortable week
  if (weekSpendable && weekSpendable.amount > 200) {
    insights.push({
      id: 'opt-comfortable-week',
      type: 'win',
      title: 'Comfortable Week Ahead',
      body: `You have $${weekSpendable.amount.toFixed(0)} available this week after all obligations. Nice work!`,
      priority: 4,
      dollarImpact: null,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

// ---------- Demo Data ----------

function makeDemoProfile(): FinancialProfile {
  const now = new Date();
  // Next pay date: next Friday
  const dayOfWeek = now.getDay();
  const daysToFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = addDays(now, daysToFriday);

  return {
    incomeAmount: 3200,
    incomeFrequency: 'biweekly',
    nextPayDate: nextFriday.toISOString().split('T')[0],
    emergencyFundTarget: 10000,
    safetyBufferPercent: 10,
    fixedBills: [
      { name: 'Rent', amount: 1450, dayOfMonth: 1, category: 'bills' },
      { name: 'Internet', amount: 65, dayOfMonth: 15, category: 'bills' },
      { name: 'Phone', amount: 45, dayOfMonth: 20, category: 'bills' },
      { name: 'Insurance', amount: 180, dayOfMonth: 28, category: 'bills' },
    ],
  };
}

// ---------- Store ----------

interface OptimizerState {
  profile: FinancialProfile | null;
  spendables: SpendableResult[];
  insights: OptimizerInsight[];
  isOnboarded: boolean;

  setProfile: (profile: FinancialProfile) => void;
  clearProfile: () => void;
  recompute: (
    transactions: Transaction[],
    predictions: SpendingPrediction[],
    goals: SavingsGoal[],
    recurringTransactions: RecurringTransaction[],
  ) => void;
  loadDemoData: () => void;
}

export const useOptimizerStore = create<OptimizerState>((set, get) => ({
  profile: null,
  spendables: [],
  insights: [],
  isOnboarded: false,

  setProfile: (profile) => {
    set({ profile, isOnboarded: true });
  },

  clearProfile: () => {
    set({ profile: null, spendables: [], insights: [], isOnboarded: false });
  },

  recompute: (transactions, predictions, goals, recurringTransactions) => {
    const { profile } = get();
    if (!profile) return;

    const spendables: SpendableResult[] = [
      computeSpendable(profile, transactions, predictions, goals, 'today'),
      computeSpendable(profile, transactions, predictions, goals, 'this_week'),
      computeSpendable(profile, transactions, predictions, goals, 'next_paycheck'),
    ];

    const insights = generateInsights(profile, spendables, transactions, recurringTransactions);

    set({ spendables, insights });
  },

  loadDemoData: () => {
    const profile = makeDemoProfile();
    set({ profile, isOnboarded: true });
  },
}));
