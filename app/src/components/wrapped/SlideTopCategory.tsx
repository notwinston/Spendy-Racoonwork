import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { TopCategorySlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: TopCategorySlide;
  isActive: boolean;
  accent: string;
}

export default function SlideTopCategory({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={2} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={styles.stinger}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>Your top category</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={250}>
          <Text style={styles.headline}>
            You lived{'\n'}for{'\n'}
            <Text style={{ color: accent }}>{data.categoryLabel}</Text>
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={500}>
          <Text style={styles.sub}>
            ${Math.round(data.amount).toLocaleString()} · ${Math.round(data.dailyRate)}/day
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
    marginBottom: 12,
  },
  headline: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
  },
  stinger: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
