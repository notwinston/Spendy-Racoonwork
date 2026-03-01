import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/constants';
import { AtmosphericBackground } from '../../src/components/ui/AtmosphericBackground';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { HiddenCostBreakdown } from '../../src/components/HiddenCostBreakdown';
import EventCostDropdown from '../../src/components/EventCostDropdown';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import CalendarConnectCard from '../../src/components/CalendarConnectCard';
import { DayDetailSheet } from '../../src/components/DayDetailSheet';
import { useCalendarStore } from '../../src/stores/calendarStore';
import { usePredictionStore } from '../../src/stores/predictionStore';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useAuthStore } from '../../src/stores/authStore';
import type { CalendarEvent, SpendingPrediction, EventCategory } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ViewMode = 'month' | 'week';

const CATEGORY_ICONS: Record<EventCategory, string> = {
  dining: 'restaurant',
  groceries: 'cart',
  transport: 'car',
  entertainment: 'film',
  shopping: 'bag',
  travel: 'airplane',
  health: 'medkit',
  education: 'school',
  fitness: 'barbell',
  social: 'people',
  professional: 'briefcase',
  bills: 'receipt',
  personal: 'person',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
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

function getSpendingColor(amount: number, maxSpending: number): string {
  if (amount <= 0) return 'transparent';
  // Opacity-based heatmap: more spending = more opaque accent background
  const opacity = Math.min(0.5, 0.1 + (amount / Math.max(maxSpending, 1)) * 0.4);
  return `rgba(0, 208, 156, ${opacity})`;
}

function getConfidenceColor(label: string): string {
  switch (label) {
    case 'high': return Colors.positive;
    case 'medium': return Colors.warning;
    case 'low': return Colors.danger;
    default: return Colors.textMuted;
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const { events, isLoading: calendarLoading, loadDemoData: loadCalendarDemo } = useCalendarStore();
  const {
    predictions,
    generatePredictions,
    isPredicting,
    hiddenCosts,
    eventCostBreakdowns,
    analyzeHiddenCostsForEvent,
    dismissHiddenCost,
    loadingHiddenCostEventIds,
    confirmEstimate,
    confirmedEstimates,
  } = usePredictionStore();
  const { transactions } = useTransactionStore();

  // Load demo data if no events
  useEffect(() => {
    if (events.length === 0 && user?.id) {
      loadCalendarDemo(user.id);
    }
  }, [user?.id, events.length, loadCalendarDemo]);

  // Generate predictions for future events — only if none exist yet (login may have already generated them)
  const hasFetchedPredictions = useRef(false);
  useEffect(() => {
    if (hasFetchedPredictions.current) return;
    if (events.length > 0 && predictions.length === 0 && !isPredicting) {
      const futureEvents = events.filter(
        (e) => new Date(e.start_time) >= new Date()
      );
      if (futureEvents.length > 0) {
        hasFetchedPredictions.current = true;
        generatePredictions(futureEvents, user?.id);
      }
    }
  }, [events.length, predictions.length, isPredicting, generatePredictions, user?.id]);

  // Map predictions by event ID for quick lookup
  const predictionMap = useMemo(() => {
    const map = new Map<string, SpendingPrediction>();
    for (const p of predictions) {
      map.set(p.calendar_event_id, p);
    }
    return map;
  }, [predictions]);

  // Compute daily spending totals for heatmap (from transactions + predictions)
  const dailySpending = useMemo(() => {
    const map = new Map<string, number>();
    // Include actual transaction spending
    for (const txn of transactions) {
      const dateKey = new Date(txn.date).toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) ?? 0) + Math.abs(txn.amount));
    }
    // Include predicted spending for future events
    for (const event of events) {
      const prediction = predictionMap.get(event.id);
      if (prediction && new Date(event.start_time) > new Date()) {
        const dateKey = new Date(event.start_time).toISOString().split('T')[0];
        map.set(dateKey, (map.get(dateKey) ?? 0) + prediction.predicted_amount);
      }
    }
    return map;
  }, [events, predictionMap, transactions]);

  // Max daily spending for heatmap scaling
  const maxDailySpending = useMemo(() => {
    let max = 0;
    for (const val of dailySpending.values()) {
      if (val > max) max = val;
    }
    return max;
  }, [dailySpending]);

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      return events.filter((e) => isSameDay(new Date(e.start_time), date));
    },
    [events]
  );

  // Get selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  }, [selectedDate, getEventsForDate]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7 * direction);
    setCurrentDate(newDate);
  };

  // Lazy-load hidden costs when user expands an event
  const handleExpandEvent = useCallback((eventId: string) => {
    setExpandedEventId(prev => {
      const newId = prev === eventId ? null : eventId;
      if (newId && !eventCostBreakdowns[newId]) {
        const event = events.find(e => e.id === newId);
        if (event) {
          analyzeHiddenCostsForEvent(event, transactions, user?.id);
        }
      }
      return newId;
    });
  }, [events, eventCostBreakdowns, analyzeHiddenCostsForEvent, transactions, user?.id]);

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetail(true);
  };

  // -- Month View --
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const today = new Date();
    const cells: React.ReactNode[] = [];

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const spending = dailySpending.get(dateKey) ?? 0;
      const isToday = isSameDay(date, today);
      const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
      const isFuture = date > today;
      const dayEvents = getEventsForDate(date);
      const hasPrediction = isFuture && dayEvents.some((e) => predictionMap.has(e.id));

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            { backgroundColor: getSpendingColor(spending, maxDailySpending) },
            isFuture && styles.dayCellFuture,
            isToday && styles.dayCellToday,
            isSelected && styles.dayCellSelected,
          ]}
          onPress={() => handleDayPress(date)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.dayTextToday,
              isSelected && styles.dayTextSelected,
            ]}
          >
            {day}
          </Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventDotRow}>
              {dayEvents.slice(0, 3).map((evt) => (
                <View
                  key={evt.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: CATEGORY_COLORS[evt.category] ?? Colors.info },
                  ]}
                />
              ))}
            </View>
          )}
          {hasPrediction && (
            <View style={styles.predictionBadge}>
              <Text style={styles.predictionBadgeText}>$</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <Card>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaderRow}>
          {DAY_NAMES.map((name) => (
            <View key={name} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>{cells}</View>

        {/* Heatmap Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Spending:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: 'rgba(0, 208, 156, 0.25)' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: 'rgba(255, 176, 32, 0.3)' }]} />
            <Text style={styles.legendText}>Med</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: 'rgba(255, 71, 87, 0.35)' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
        </View>
      </Card>
    );
  };

  // -- Week View --
  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate);
    const today = new Date();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <View>
        {/* Week Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[weekStart.getMonth()]} {weekStart.getDate()} -{' '}
            {MONTHS[days[6].getMonth()]} {days[6].getDate()}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {days.map((date) => {
          const dayEvents = getEventsForDate(date);
          const isToday = isSameDay(date, today);

          return (
            <View
              key={date.toISOString()}
              style={[styles.weekDayContainer, isToday && styles.weekDayToday]}
            >
              <TouchableOpacity
                onPress={() => handleDayPress(date)}
                activeOpacity={0.7}
              >
                <View style={styles.weekDayHeader}>
                  <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                    {DAY_NAMES[date.getDay()]}
                  </Text>
                  <Text style={[styles.weekDayNumber, isToday && styles.weekDayNumberToday]}>
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.weekDayEvents}>
                {dayEvents.length === 0 ? (
                  <Text style={styles.noEventsText}>No events</Text>
                ) : (
                  dayEvents.slice(0, 3).map((event) => {
                    const prediction = predictionMap.get(event.id);
                    return (
                      <React.Fragment key={event.id}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleExpandEvent(event.id)}
                        >
                          <View style={styles.weekEventItem}>
                            <View style={styles.weekEventTime}>
                              <Text style={styles.weekEventTimeText}>
                                {formatTime(event.start_time)}
                              </Text>
                            </View>
                            <View style={styles.weekEventContent}>
                              <Text style={styles.weekEventTitle} numberOfLines={1}>
                                {event.title}
                              </Text>
                              {prediction && (
                                <Text style={styles.weekEventPrediction}>
                                  ~${prediction.predicted_amount.toFixed(0)}
                                </Text>
                              )}
                              {eventCostBreakdowns[event.id] &&
                                eventCostBreakdowns[event.id].hidden_costs.filter(c => !c.is_dismissed).length > 0 && (
                                <Text style={styles.weekEventHiddenCost}>
                                  +${eventCostBreakdowns[event.id].hidden_costs
                                    .filter(c => !c.is_dismissed)
                                    .reduce((s, c) => s + c.predicted_amount, 0)
                                    .toFixed(0)} hidden
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        {expandedEventId === event.id && loadingHiddenCostEventIds.has(event.id) && (
                          <View style={styles.predictingBanner}>
                            <ActivityIndicator size="small" color={Colors.accent} />
                            <Text style={styles.predictingText}>Analyzing hidden costs...</Text>
                          </View>
                        )}
                        {expandedEventId === event.id && eventCostBreakdowns[event.id] && (
                          <EventCostDropdown
                            breakdown={eventCostBreakdowns[event.id]}
                            isExpanded={true}
                            onToggle={() => setExpandedEventId(null)}
                            onConfirm={() => confirmEstimate(event.id)}
                            onDismissCost={dismissHiddenCost}
                            isConfirmed={!!confirmedEstimates[event.id]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                {dayEvents.length > 3 && (
                  <Text style={styles.moreEventsText}>
                    +{dayEvents.length - 3} more
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (calendarLoading) {
    return (
      <AtmosphericBackground variant="calendar">
        <Header title="Calendar" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </AtmosphericBackground>
    );
  }

  return (
    <AtmosphericBackground variant="calendar">
      <Header title="Calendar" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* View Mode Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, viewMode === 'month' && styles.toggleActive]}
            onPress={() => setViewMode('month')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'month' && styles.toggleTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, viewMode === 'week' && styles.toggleActive]}
            onPress={() => setViewMode('week')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'week' && styles.toggleTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar View */}
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}

        {/* Calendar Connect */}
        <CalendarConnectCard userId={user?.id ?? 'demo-user'} />

        {/* Quick Day Summary below the calendar */}
        {selectedDate && selectedDayEvents.length > 0 && viewMode === 'month' && (
          <View style={styles.quickSummary}>
            <Text style={styles.sectionTitle}>
              {isSameDay(selectedDate, new Date())
                ? "Today's Events"
                : `Events for ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
            </Text>
            {selectedDayEvents.slice(0, 3).map((event, index) => {
              const prediction = predictionMap.get(event.id);
              return (
                <Animated.View
                  key={event.id}
                  entering={FadeIn.delay(index * 80).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => setShowDayDetail(true)}
                    activeOpacity={0.7}
                  >
                    <GlassCard style={styles.quickEventCard}>
                      <View style={styles.quickEventRow}>
                        <View style={styles.quickEventLeft}>
                          <Text style={styles.quickEventTime}>
                            {formatTime(event.start_time)}
                          </Text>
                          <Text style={styles.quickEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>
                        {prediction && (
                          <Text style={styles.quickEventAmount}>
                            ~${prediction.predicted_amount.toFixed(0)}
                          </Text>
                        )}
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
            {selectedDayEvents.length > 3 && (
              <TouchableOpacity onPress={() => setShowDayDetail(true)}>
                <Text style={styles.viewAllText}>
                  View all {selectedDayEvents.length} events
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isPredicting && (
          <View style={styles.predictingBanner}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.predictingText}>Generating spending predictions...</Text>
          </View>
        )}
      </ScrollView>

      <DayDetailSheet
        date={selectedDate ? selectedDate.toISOString() : new Date().toISOString()}
        events={selectedDayEvents}
        spending={selectedDate ? (dailySpending.get(selectedDate.toISOString().split('T')[0]) ?? 0) : 0}
        predictions={predictions}
        visible={showDayDetail}
        onClose={() => setShowDayDetail(false)}
      />
      <FloatingChatButton />
    </AtmosphericBackground>
  );
}

const cellSize = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.lg * 2 - 6) / 7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.glassBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  toggle: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    fontWeight: Typography.weights.medium,
  },
  toggleTextActive: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  // Month Navigation
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // Day Headers
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeaderCell: {
    width: cellSize,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayHeaderText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: cellSize,
    height: cellSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellFuture: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.cardBorder,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.glowTeal,
    shadowColor: Colors.glowTeal,
    shadowRadius: 8,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    width: cellSize + 4,
    height: cellSize + 4,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: Colors.info,
  },
  dayText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
  },
  dayTextToday: {
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  dayTextSelected: {
    color: Colors.info,
    fontWeight: Typography.weights.bold,
  },
  eventDotRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  predictionBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionBadgeText: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  legendLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  // Week View
  weekDayContainer: {
    backgroundColor: Colors.glassBg,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  weekDayToday: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  weekDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  weekDayName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textMuted,
    width: 36,
  },
  weekDayNameToday: {
    color: Colors.accent,
    fontWeight: Typography.weights.bold,
  },
  weekDayNumber: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  weekDayNumberToday: {
    color: Colors.accent,
  },
  weekDayEvents: {
    paddingLeft: Spacing['3xl'],
  },
  weekEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  weekEventTime: {
    width: 70,
  },
  weekEventTimeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  weekEventContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekEventTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  weekEventPrediction: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
    marginLeft: Spacing.sm,
  },
  weekEventHiddenCost: {
    fontSize: Typography.sizes.xs,
    color: Colors.warning,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.xs,
  },
  noEventsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  moreEventsText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  // Quick Summary
  quickSummary: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  quickEventCard: {
    marginBottom: Spacing.sm,
  },
  quickEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickEventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  quickEventTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    width: 70,
  },
  quickEventTitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  quickEventAmount: {
    fontSize: Typography.sizes.md,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  // Predicting Banner
  predictingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.glassBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  predictingText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
  },
  // Day Detail Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: Colors.accent + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  todayBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  // Event Cards in Modal
  eventCard: {
    marginBottom: Spacing.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eventCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  eventTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingLeft: Spacing['3xl'] + Spacing.md,
  },
  eventDetailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  // Prediction Section in Event Card
  predictionSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '22',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  predictionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
  },
  predictionAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  predictionAmount: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  predictionRange: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  confidenceLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  predictionExplanation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
