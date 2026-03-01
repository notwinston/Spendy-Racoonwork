import { create } from 'zustand';

interface InsightsMonthState {
  selectedMonth: { year: number; month: number };
  goForward: () => void;
  goBack: () => void;
  resetToCurrent: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export const useInsightsMonthStore = create<InsightsMonthState>((set) => ({
  selectedMonth: getCurrentMonth(),

  goForward: () =>
    set((state) => {
      const now = new Date();
      const maxYear = now.getFullYear();
      const maxMonth = now.getMonth() + 3;
      const nextMonth = state.selectedMonth.month + 1;
      const nextYear = state.selectedMonth.year + (nextMonth > 11 ? 1 : 0);
      const normalizedMonth = nextMonth > 11 ? 0 : nextMonth;
      // Check against max (current + 3 months)
      if (nextYear * 12 + normalizedMonth > maxYear * 12 + maxMonth) {
        return state;
      }
      return { selectedMonth: { year: nextYear, month: normalizedMonth } };
    }),

  goBack: () =>
    set((state) => {
      const prevMonth = state.selectedMonth.month - 1;
      const prevYear = state.selectedMonth.year + (prevMonth < 0 ? -1 : 0);
      const normalizedMonth = prevMonth < 0 ? 11 : prevMonth;
      return { selectedMonth: { year: prevYear, month: normalizedMonth } };
    }),

  resetToCurrent: () => set({ selectedMonth: getCurrentMonth() }),
}));

/** Whether the selected month is the current calendar month. */
export function isCurrentMonth(selected: { year: number; month: number }): boolean {
  const now = new Date();
  return selected.year === now.getFullYear() && selected.month === now.getMonth();
}

/** Human-readable label, e.g. "March 2026". */
export function getDisplayLabel(selected: { year: number; month: number }): string {
  return `${MONTH_NAMES[selected.month]} ${selected.year}`;
}
