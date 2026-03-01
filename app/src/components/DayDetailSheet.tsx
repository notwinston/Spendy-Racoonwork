import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants';
import { GlassCard } from './ui/GlassCard';
import EventCostDropdown from './EventCostDropdown';
import { usePredictionStore } from '../stores/predictionStore';
import type { CalendarEvent, SpendingPrediction, EventCategory } from '../types';

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

interface DayDetailSheetProps {
  date: string;
  events: CalendarEvent[];
  spending: number;
  predictions: SpendingPrediction[];
  visible: boolean;
  onClose: () => void;
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

function formatDateTitle(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function DayDetailSheet({
  date,
  events,
  spending,
  predictions,
  visible,
  onClose,
}: DayDetailSheetProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { eventCostBreakdowns, dismissHiddenCost, confirmEstimate, confirmedEstimates } = usePredictionStore();

  const predictionMap = new Map<string, SpendingPrediction>();
  for (const p of predictions) {
    predictionMap.set(p.calendar_event_id, p);
  }

  const isToday =
    new Date(date).toDateString() === new Date().toDateString();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{formatDateTitle(date)}</Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Spending Total */}
          {spending > 0 && (
            <View style={styles.spendingRow}>
              <Ionicons name="wallet-outline" size={16} color={Colors.accent} />
              <Text style={styles.spendingLabel}>Day Spending</Text>
              <Text style={styles.spendingAmount}>${spending.toFixed(2)}</Text>
            </View>
          )}

          {/* Events List */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No events for this day</Text>
              </View>
            ) : (
              events.map((event, index) => {
                const prediction = predictionMap.get(event.id);
                const dotColor = CATEGORY_COLORS[event.category] ?? Colors.textMuted;
                const hasBreakdown = !!eventCostBreakdowns[event.id];

                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeIn.delay(index * 60).duration(300)}
                  >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedEventId(prev => prev === event.id ? null : event.id)}
                  >
                    <GlassCard style={styles.eventCard}>
                      <View style={styles.eventRow}>
                        <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventTitle}>{event.title}</Text>
                          <Text style={styles.eventTime}>
                            {formatTime(event.start_time)}
                            {event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
                          </Text>
                          {event.location && (
                            <Text style={styles.eventLocation}>{event.location}</Text>
                          )}
                        </View>
                        {prediction && (
                          <Text style={styles.eventAmount}>
                            ~${prediction.predicted_amount.toFixed(0)}
                          </Text>
                        )}
                        {hasBreakdown && (
                          <Ionicons
                            name={expandedEventId === event.id ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={Colors.textMuted}
                            style={{ marginLeft: Spacing.xs }}
                          />
                        )}
                      </View>

                      {/* Prediction Card */}
                      {prediction && (
                        <View style={styles.predictionCard}>
                          <View style={styles.predictionRow}>
                            <Ionicons name="analytics-outline" size={14} color={Colors.accent} />
                            <Text style={styles.predictionLabel}>
                              Predicted: ${prediction.predicted_amount.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={styles.predictionRange}>
                            Range: ${prediction.prediction_low.toFixed(0)} - ${prediction.prediction_high.toFixed(0)}
                          </Text>
                          {prediction.explanation && (
                            <Text style={styles.predictionExplanation}>
                              {prediction.explanation}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Cost Breakdown Dropdown */}
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
                    </GlassCard>
                  </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgApp,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Spacing['3xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.glassBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
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
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 12,
  },
  spendingLabel: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  spendingAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  scroll: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  eventCard: {
    marginBottom: Spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventInfo: {
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
  eventLocation: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventAmount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  predictionCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '22',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  predictionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent,
  },
  predictionRange: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  predictionExplanation: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
