import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FadeUp, RollIn, ScaleIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { SummarySlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: SummarySlide;
  isActive: boolean;
  accent: string;
}

export default function SlideSummary({ data, isActive, accent }: Props) {
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      Alert.alert('Share', 'Unable to share at this time.');
    }
  };

  const gridItems = [
    { label: 'Saved', value: `$${Math.round(data.savedAmount).toLocaleString()}`, color: accent },
    { label: 'Streak', value: `${data.streakCount}mo`, color: '#A259FF' },
    { label: 'Top Cat', value: data.topCategoryEmoji, color: '#3DFFEA' },
    { label: 'Score', value: `${data.healthScore}`, color: '#FFD166' },
  ];

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.shotContainer}>
        <SlideBackgroundView patternIndex={7} accent={accent} />

        <View style={styles.content}>
          <FadeUp isActive={isActive} delay={0}>
            <View style={[styles.separator, { backgroundColor: accent }]} />
          </FadeUp>

          <FadeUp isActive={isActive} delay={100}>
            <Text style={styles.eyebrow}>{data.rankLabel}</Text>
          </FadeUp>

          <RollIn isActive={isActive} delay={250}>
            <Text style={[styles.bignum, { color: accent }]}>{data.healthScore}</Text>
          </RollIn>

          <FadeUp isActive={isActive} delay={350}>
            <Text style={styles.sub}>Financial Score / 100</Text>
          </FadeUp>

          <View style={styles.grid}>
            {gridItems.map((item, i) => (
              <ScaleIn key={item.label} isActive={isActive} delay={450 + i * 80}>
                <View style={styles.gridCell}>
                  <Text style={[styles.gridValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                </View>
              </ScaleIn>
            ))}
          </View>
        </View>
      </ViewShot>

      <FadeUp isActive={isActive} delay={750}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>Share My Wrapped ↗</Text>
        </TouchableOpacity>
      </FadeUp>
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
  shotContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#050D1A',
    paddingVertical: 20,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  bignum: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 56,
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: SCREEN_WIDTH * 0.7,
    justifyContent: 'center',
  },
  gridCell: {
    width: (SCREEN_WIDTH * 0.7 - 10) / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  gridValue: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 22,
    marginBottom: 4,
  },
  gridLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  shareText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 15,
    color: '#050D1A',
    textAlign: 'center',
  },
});
