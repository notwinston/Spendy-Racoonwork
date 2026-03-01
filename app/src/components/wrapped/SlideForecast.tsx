import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { ForecastSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: ForecastSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideForecast({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={6} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={[styles.stinger, { color: accent }]}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>Next month forecast</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={250}>
          <Text style={styles.headline}>
            Here's what{'\n'}next month{'\n'}
            <Text style={{ color: accent }}>looks like</Text>
          </Text>
        </RollIn>

        <RollIn isActive={isActive} delay={450}>
          <Text style={[styles.bignum, { color: accent }]}>
            ${Math.round(data.forecastAmount).toLocaleString()}
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={600}>
          <Text style={styles.sub}>projected spending based on 3-month average</Text>
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
    marginBottom: 12,
  },
  headline: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 20,
  },
  bignum: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 42,
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  stinger: {
    position: 'absolute',
    top: 100,
    right: -10,
    fontFamily: 'Syne_800ExtraBold',
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
