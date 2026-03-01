/**
 * Financial calculation utilities for FutureSpend insights and projections.
 */

/**
 * Calculate compound growth future value.
 * FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
 *
 * @param pv - Present value (current savings)
 * @param pmt - Payment per period (monthly contribution)
 * @param rate - Interest rate per period (e.g. 0.005 for 0.5% monthly)
 * @param periods - Number of periods (months)
 * @returns Future value
 */
export function calculateCompoundGrowth(
  pv: number,
  pmt: number,
  rate: number,
  periods: number,
): number {
  if (rate === 0) {
    return pv + pmt * periods;
  }
  const compoundFactor = Math.pow(1 + rate, periods);
  return pv * compoundFactor + pmt * ((compoundFactor - 1) / rate);
}

/**
 * Get three-scenario projection data (conservative, expected, optimistic)
 * for each month up to the given number of months.
 *
 * @param currentSavings - Current savings balance
 * @param monthlySavings - Monthly savings contribution
 * @param months - Number of months to project
 * @param annualRate - Annual interest rate (default 0.05 = 5%)
 * @returns Object with conservative, expected, optimistic arrays of { month, value }
 */
export function getProjectionScenarios(
  currentSavings: number,
  monthlySavings: number,
  months: number,
  annualRate: number = 0.05,
): {
  conservative: { month: number; value: number }[];
  expected: { month: number; value: number }[];
  optimistic: { month: number; value: number }[];
} {
  const monthlyRate = annualRate / 12;

  const conservative: { month: number; value: number }[] = [];
  const expected: { month: number; value: number }[] = [];
  const optimistic: { month: number; value: number }[] = [];

  for (let m = 1; m <= months; m++) {
    conservative.push({
      month: m,
      value: Math.round(calculateCompoundGrowth(currentSavings, monthlySavings * 0.8, monthlyRate, m) * 100) / 100,
    });
    expected.push({
      month: m,
      value: Math.round(calculateCompoundGrowth(currentSavings, monthlySavings, monthlyRate, m) * 100) / 100,
    });
    optimistic.push({
      month: m,
      value: Math.round(calculateCompoundGrowth(currentSavings, monthlySavings * 1.2, monthlyRate, m) * 100) / 100,
    });
  }

  return { conservative, expected, optimistic };
}

/**
 * Calculate savings rate as a fraction.
 *
 * @param income - Total income
 * @param spending - Total spending
 * @returns Savings rate (0-1 fraction, can be negative if spending > income)
 */
export function calculateSavingsRate(income: number, spending: number): number {
  if (income === 0) return 0;
  return (income - spending) / income;
}

/**
 * Format a number as currency string.
 *
 * @param amount - Numeric amount
 * @param currency - Currency code (default 'USD')
 * @returns Formatted string e.g. "$1,234.56"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency === 'USD' ? '$' : currency;
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Format a numeric value as a percentage string.
 *
 * @param value - Numeric value (e.g. 0.34 for 34%)
 * @param decimals - Decimal places (default 1)
 * @returns Formatted string e.g. "34.0%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
