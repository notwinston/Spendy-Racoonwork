import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn, ScaleIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { IntroSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: IntroSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideIntro({ data, isActive, accent }: Props) {
  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={0} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={[styles.stinger, { color: accent }]}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <ScaleIn isActive={isActive} delay={100}>
          <View style={[styles.chip, { borderColor: accent }]}>
            <Text style={[styles.chipText, { color: accent }]}>✦ {data.monthName} ✦</Text>
          </View>
        </ScaleIn>

        <RollIn isActive={isActive} delay={250}>
          <Text style={styles.headline} adjustsFontSizeToFit numberOfLines={2}>
            {data.monthName}{'\n'}
            <Text style={{ color: accent }}>Flashback</Text>
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={500}>
          <Text style={styles.sub}>Your month in review</Text>
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
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  chipText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    letterSpacing: 2,
  },
  headline: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 42,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    textAlign: 'center',
  },
  stinger: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    fontFamily: 'Syne_800ExtraBold',
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
