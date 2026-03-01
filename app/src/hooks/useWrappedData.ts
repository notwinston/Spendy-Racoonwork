import { useMemo } from 'react';
import { useTransactionStore, getMonthlyTotals } from '../stores/transactionStore';
import { useBudgetStore, calculateHealthScoreV2, calculateBudgetAdherenceMVP, calculateSpendingStability } from '../stores/budgetStore';
import { useAuthStore } from '../stores/authStore';
import { calculateSavingsRate } from '../utils/financialCalcs';
import { WRAPPED_PALETTES, CATEGORY_EMOJI, type WrappedPalette } from '../components/wrapped/wrappedPalettes';
import type { Transaction, EventCategory } from '../types';

function formatAbbreviated(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Math.round(n).toString();
}

function getRankLabel(score: number): string {
  if (score >= 90) return "You're a Money Master 💰";
  if (score >= 75) return "You're a Smart Saver 🌱";
  if (score >= 60) return "You're Building Momentum 🔥";
  if (score >= 40) return "You're Finding Your Way 🧭";
  return "You're Just Getting Started 🚀";
}

export interface CategoryBreakdown {
  category: EventCategory;
  amount: number;
  emoji: string;
  fraction: number;
}

export interface BudgetMonthEntry {
  label: string;
  hit: boolean;
}

export interface BiggestPurchaseData {
  merchantName: string;
  date: string;
  amount: number;
  category: EventCategory;
}

export interface WrappedSlideData {
  type: 'intro' | 'totalSpent' | 'topCategory' | 'savings' | 'budgetStreak' | 'biggestPurchase' | 'forecast' | 'summary';
  stinger: string | null;
}

export interface IntroSlide extends WrappedSlideData {
  type: 'intro';
  monthName: string;
}

export interface TotalSpentSlide extends WrappedSlideData {
  type: 'totalSpent';
  totalSpent: number;
  transactionCount: number;
  dailyRate: number;
  topCategories: CategoryBreakdown[];
  monthName: string;
}

export interface TopCategorySlide extends WrappedSlideData {
  type: 'topCategory';
  category: EventCategory;
  categoryLabel: string;
  amount: number;
  dailyRate: number;
  emoji: string;
  monthName: string;
}

export interface SavingsSlide extends WrappedSlideData {
  type: 'savings';
  savedAmount: number;
  savingsRate: number;
  monthName: string;
}

export interface BudgetStreakSlide extends WrappedSlideData {
  type: 'budgetStreak';
  streakCount: number;
  months: BudgetMonthEntry[];
}

export interface BiggestPurchaseSlide extends WrappedSlideData {
  type: 'biggestPurchase';
  purchase: BiggestPurchaseData;
}

export interface ForecastSlide extends WrappedSlideData {
  type: 'forecast';
  forecastAmount: number;
}

export interface SummarySlide extends WrappedSlideData {
  type: 'summary';
  healthScore: number;
  rankLabel: string;
  savedAmount: number;
  streakCount: number;
  topCategory: string;
  topCategoryEmoji: string;
}

export type SlideData = IntroSlide | TotalSpentSlide | TopCategorySlide | SavingsSlide | BudgetStreakSlide | BiggestPurchaseSlide | ForecastSlide | SummarySlide;

export interface WrappedData {
  slides: SlideData[];
  palettes: WrappedPalette[];
  monthName: string;
  hasIncome: boolean;
  hasData: boolean;
}

export function useWrappedData(): WrappedData {
  const transactions = useTransactionStore((s) => s.transactions);
  const { totalBudget } = useBudgetStore();
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthName = lastMonthStart.toLocaleString('en-US', { month: 'long' });
    const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

    // Filter to last month
    const lastMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    if (lastMonthTxns.length === 0) {
      return { slides: [], palettes: [], monthName, hasIncome: false, hasData: false };
    }

    // Total spent
    const totalSpent = lastMonthTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const transactionCount = lastMonthTxns.length;
    const dailyRate = totalSpent / daysInLastMonth;

    // Category breakdown
    const categoryMap: Partial<Record<EventCategory, number>> = {};
    for (const t of lastMonthTxns) {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    }
    const sortedCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({
        category: cat as EventCategory,
        amount,
        emoji: CATEGORY_EMOJI[cat as EventCategory] || '📦',
        fraction: totalSpent > 0 ? amount / totalSpent : 0,
      }));
    const topCategories = sortedCategories.slice(0, 5);
    const topCategory = sortedCategories[0];

    // Income & savings
    const monthlyIncome = user?.monthlyIncome;
    const hasIncome = monthlyIncome != null && monthlyIncome > 0;
    const savingsRate = hasIncome ? calculateSavingsRate(monthlyIncome!, totalSpent) : 0;
    const savedAmount = hasIncome ? monthlyIncome! - totalSpent : 0;

    // Budget streak (12 months)
    const monthlyTotals12 = getMonthlyTotals(transactions, 12);
    const budgetMonths: BudgetMonthEntry[] = monthlyTotals12.map((m) => ({
      label: m.label,
      hit: m.value <= totalBudget,
    }));
    let streakCount = 0;
    for (let i = budgetMonths.length - 1; i >= 0; i--) {
      if (budgetMonths[i].hit) {
        streakCount++;
      } else {
        break;
      }
    }

    // Biggest purchase
    const biggest = lastMonthTxns.reduce<Transaction | null>((max, t) =>
      !max || Math.abs(t.amount) > Math.abs(max.amount) ? t : max, null);
    const biggestPurchase: BiggestPurchaseData = biggest
      ? {
          merchantName: biggest.merchant_name || 'Unknown',
          date: biggest.date,
          amount: Math.abs(biggest.amount),
          category: biggest.category,
        }
      : { merchantName: 'Unknown', date: '', amount: 0, category: 'other' };

    // Forecast (3-month average)
    const monthlyTotals3 = getMonthlyTotals(transactions, 3);
    const forecastAmount = monthlyTotals3.length > 0
      ? monthlyTotals3.reduce((sum, m) => sum + m.value, 0) / monthlyTotals3.length
      : 0;

    // Health score
    const budgetAdherence = calculateBudgetAdherenceMVP(totalSpent, totalBudget);
    const savingsRatePct = Math.max(0, savingsRate * 100);
    const stability = calculateSpendingStability(transactions);
    const streakDays = user?.streakCount ?? 0;
    const healthScore = calculateHealthScoreV2(budgetAdherence, savingsRatePct, stability, 0, streakDays);
    const rankLabel = getRankLabel(healthScore);

    // Year digits for stinger
    const yearDigits = now.getFullYear().toString().slice(-2);

    // Build slides
    const allSlides: SlideData[] = [];

    // Slide 0: Intro
    allSlides.push({
      type: 'intro',
      monthName,
      stinger: yearDigits,
    });

    // Slide 1: Total Spent
    allSlides.push({
      type: 'totalSpent',
      totalSpent,
      transactionCount,
      dailyRate,
      topCategories,
      monthName,
      stinger: formatAbbreviated(totalSpent),
    });

    // Slide 2: Top Category
    allSlides.push({
      type: 'topCategory',
      category: topCategory?.category ?? 'other',
      categoryLabel: topCategory ? topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1) : 'Other',
      amount: topCategory?.amount ?? 0,
      dailyRate: topCategory ? topCategory.amount / daysInLastMonth : 0,
      emoji: topCategory?.emoji ?? '📦',
      monthName,
      stinger: topCategory?.emoji ?? '📦',
    });

    // Slide 3: Savings (conditional)
    if (hasIncome) {
      allSlides.push({
        type: 'savings',
        savedAmount,
        savingsRate,
        monthName,
        stinger: Math.round(savingsRate * 100).toString(),
      });
    }

    // Slide 4: Budget Streak
    allSlides.push({
      type: 'budgetStreak',
      streakCount,
      months: budgetMonths,
      stinger: null,
    });

    // Slide 5: Biggest Purchase
    allSlides.push({
      type: 'biggestPurchase',
      purchase: biggestPurchase,
      stinger: formatAbbreviated(biggestPurchase.amount),
    });

    // Slide 6: Forecast
    allSlides.push({
      type: 'forecast',
      forecastAmount,
      stinger: formatAbbreviated(forecastAmount),
    });

    // Slide 7: Summary
    allSlides.push({
      type: 'summary',
      healthScore,
      rankLabel,
      savedAmount: hasIncome ? savedAmount : 0,
      streakCount,
      topCategory: topCategory?.category ?? 'other',
      topCategoryEmoji: topCategory?.emoji ?? '📦',
      stinger: null,
    });

    // Remap palettes when savings is skipped
    let palettes: WrappedPalette[];
    if (hasIncome) {
      palettes = WRAPPED_PALETTES;
    } else {
      // slides 0-2 keep palettes 0-2, then 3→4, 4→5, 5→6, 6→7
      palettes = [
        WRAPPED_PALETTES[0],
        WRAPPED_PALETTES[1],
        WRAPPED_PALETTES[2],
        WRAPPED_PALETTES[4],
        WRAPPED_PALETTES[5],
        WRAPPED_PALETTES[6],
        WRAPPED_PALETTES[7],
      ];
    }

    return { slides: allSlides, palettes, monthName, hasIncome, hasData: true };
  }, [transactions, totalBudget, user]);
}
