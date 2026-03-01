import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';

export interface BillItem {
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
}

export interface BillCalendarViewProps {
  bills: BillItem[];
}

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function BillCalendarView({ bills }: BillCalendarViewProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Map bills to days
  const billsByDay = useMemo(() => {
    const map: Record<number, BillItem[]> = {};
    bills.forEach((bill) => {
      const d = new Date(bill.dueDate);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(bill);
      }
    });
    return map;
  }, [bills, month, year]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    // Leading empty days
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Upcoming bills in next 30 days
  const upcomingBills = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 30);
    return bills
      .filter((b) => {
        const d = new Date(b.dueDate);
        return d >= now && d <= cutoff;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [bills]);

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>{monthName}</Text>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAY_NAMES.map((name, idx) => (
          <Text key={idx} style={styles.dayHeaderText}>{name}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, idx) => {
          const hasBill = day != null && billsByDay[day];
          const isToday = day === now.getDate();
          const isPast = day != null && day < now.getDate();

          return (
            <View key={idx} style={styles.dayCell}>
              {day != null ? (
                <View
                  style={[
                    styles.dayCellInner,
                    isToday && styles.dayCellToday,
                    hasBill ? styles.dayCellBill : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isPast && styles.dayTextPast,
                    ]}
                  >
                    {day}
                  </Text>
                  {hasBill ? <View style={styles.billDot} /> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Upcoming bills list */}
      {upcomingBills.length > 0 && (
        <View style={styles.billList}>
          <Text style={styles.billListTitle}>Upcoming Bills</Text>
          {upcomingBills.map((bill, idx) => {
            const dueDate = new Date(bill.dueDate);
            const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <View key={idx} style={styles.billRow}>
                <View style={styles.billDotSmall} />
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billDate}>{dateStr}</Text>
                <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  monthLabel: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    ...Typography.caption.meta,
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCellInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.radiusSm,
  },
  dayCellToday: {
    backgroundColor: Colors.accentDark,
  },
  dayCellBill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  dayText: {
    ...Typography.caption.meta,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  dayTextToday: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  dayTextPast: {
    color: Colors.textMuted,
  },
  billDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warning,
    position: 'absolute',
    bottom: 4,
  },
  billList: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.md,
  },
  billListTitle: {
    ...Typography.label.card,
    marginBottom: Spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.sm,
  },
  billDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
  billName: {
    flex: 1,
    ...Typography.body.small,
    color: Colors.textPrimary,
  },
  billDate: {
    ...Typography.caption.meta,
    color: Colors.textMuted,
    width: 60,
  },
  billAmount: {
    ...Typography.numeric.inlineValue,
    width: 60,
    textAlign: 'right',
  },
});
