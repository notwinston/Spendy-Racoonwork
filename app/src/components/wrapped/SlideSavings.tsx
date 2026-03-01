import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { SavingsSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: SavingsSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideSavings({ data, isActive, accent }: Props) {
  const ratePercent = Math.round(data.savingsRate * 100);

  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={3} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={[styles.stinger, { color: accent }]}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>You saved</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={250}>
          <Text style={[styles.bignum, { color: accent }]}>
            ${Math.round(Math.max(0, data.savedAmount)).toLocaleString()}
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={400}>
          <Text style={[styles.mednum, { color: accent }]}>
            {ratePercent}% savings rate
          </Text>
        </FadeUp>

        <FadeUp isActive={isActive} delay={550}>
          <Text style={styles.sub}>
            in {data.monthName}
          </Text>
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
  mednum: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    marginTop: 8,
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  stinger: {
    position: 'absolute',
    top: 120,
    left: 10,
    fontFamily: 'Syne_800ExtraBold',
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
