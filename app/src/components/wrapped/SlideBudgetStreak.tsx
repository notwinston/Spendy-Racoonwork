import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn, ScaleIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { BudgetStreakSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: BudgetStreakSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideBudgetStreak({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={4} accent={accent} />

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>Budget streak</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={250}>
          <Text style={[styles.bignum, { color: accent }]}>{data.streakCount}</Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={350}>
          <Text style={styles.sub}>months under budget</Text>
        </FadeUp>

        {/* 12-month grid (6×2) */}
        <FadeUp isActive={isActive} delay={450}>
          <View style={styles.grid}>
            {data.months.map((m, i) => (
              <ScaleIn key={i} isActive={isActive} delay={500 + i * 40}>
                <View style={[styles.cell, m.hit ? styles.cellHit : styles.cellMiss]}>
                  <Text style={[styles.cellText, m.hit && { color: accent }]}>{m.label}</Text>
                </View>
              </ScaleIn>
            ))}
          </View>
        </FadeUp>
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
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    width: SCREEN_WIDTH * 0.7,
  },
  cell: {
    width: (SCREEN_WIDTH * 0.7 - 40) / 6,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellHit: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cellMiss: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cellText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
});
