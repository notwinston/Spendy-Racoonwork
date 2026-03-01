import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn, ScaleIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { TotalSpentSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: TotalSpentSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideTotalSpent({ data, isActive, accent }: Props) {
  const maxAmount = data.topCategories[0]?.amount ?? 1;

  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={1} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={[styles.stinger, { color: accent }]}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>Total spent in {data.monthName}</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={200}>
          <Text style={[styles.bignum, { color: accent }]}>
            ${Math.round(data.totalSpent).toLocaleString()}
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={350}>
          <Text style={styles.sub}>
            {data.transactionCount} transactions · ${Math.round(data.dailyRate)}/day
          </Text>
        </FadeUp>

        <View style={styles.barsContainer}>
          {data.topCategories.map((cat, i) => (
            <ScaleIn key={cat.category} isActive={isActive} delay={450 + i * 80}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>
                  {cat.emoji} {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: accent,
                        width: `${(cat.amount / maxAmount) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barAmount}>${Math.round(cat.amount)}</Text>
              </View>
            </ScaleIn>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  separator: {
    width: 32,
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bignum: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 42,
    textAlign: 'center',
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    marginBottom: 24,
  },
  barsContainer: {
    width: '100%',
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barAmount: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    width: 50,
    textAlign: 'right',
  },
  stinger: {
    position: 'absolute',
    top: 100,
    left: -10,
    fontFamily: 'Syne_800ExtraBold',
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
