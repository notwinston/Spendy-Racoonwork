import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';
import type { CalendarEvent, EventCategory } from '../types';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  dining: Colors.negative,
  groceries: Colors.positive,
  transport: Colors.accentBright,
  entertainment: '#8B5CF6',
  shopping: Colors.warning,
  travel: '#06B6D4',
  health: '#EC4899',
  education: '#8B5CF6',
  fitness: '#14B8A6',
  social: '#F97316',
  professional: '#6366F1',
  bills: Colors.negative,
  personal: Colors.textMuted,
  other: Colors.textSecondary,
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekTimelineProps {
  events: CalendarEvent[];
  selectedDate: string;
}

function getWeekStart(dateStr: string): Date {
  const date = new Date(dateStr);
  const day = date.getDay();
  // Shift so Monday = 0
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function WeekTimeline({ events, selectedDate }: WeekTimelineProps) {
  const weekStart = getWeekStart(selectedDate);

  const dayColumns = DAY_LABELS.map((label, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);

    const dayEvents = events.filter((e) =>
      isSameDay(new Date(e.start_time), day)
    );

    const isSelected = isSameDay(day, new Date(selectedDate));

    return (
      <View key={label} style={[styles.column, isSelected && styles.columnSelected]}>
        <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
          {label}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
          {day.getDate()}
        </Text>
        <View style={styles.eventsArea}>
          {dayEvents.slice(0, 4).map((event) => (
            <View
              key={event.id}
              style={[
                styles.eventBar,
                { backgroundColor: CATEGORY_COLORS[event.category] ?? Colors.accent },
              ]}
            />
          ))}
        </View>
      </View>
    );
  });

  return <View style={styles.container}>{dayColumns}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  columnSelected: {
    backgroundColor: Colors.accent + '15',
  },
  dayLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
  },
  dayLabelSelected: {
    color: Colors.accent,
  },
  dayNumber: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dayNumberSelected: {
    color: Colors.accent,
  },
  eventsArea: {
    marginTop: Spacing.sm,
    gap: 3,
    width: '80%',
    alignItems: 'center',
  },
  eventBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
});
