import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FadeUp, RollIn } from './animations';
import SlideBackgroundView from './SlideBackground';
import type { BiggestPurchaseSlide } from '../../hooks/useWrappedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: BiggestPurchaseSlide;
  isActive: boolean;
  accent: string;
}

export default function SlideBiggestPurchase({ data, isActive, accent }: Props) {
  const formattedDate = data.purchase.date
    ? new Date(data.purchase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={styles.container}>
      <SlideBackgroundView patternIndex={5} accent={accent} />

      {/* Stinger */}
      {data.stinger && (
        <Text style={[styles.stinger, { color: accent }]}>{data.stinger}</Text>
      )}

      <View style={styles.content}>
        <FadeUp isActive={isActive} delay={0}>
          <View style={[styles.separator, { backgroundColor: accent }]} />
        </FadeUp>

        <FadeUp isActive={isActive} delay={100}>
          <Text style={styles.eyebrow}>Biggest purchase</Text>
        </FadeUp>

        <RollIn isActive={isActive} delay={250}>
          <Text style={styles.headline}>
            Your boldest{'\n'}
            <Text style={{ color: accent }}>move.</Text>
          </Text>
        </RollIn>

        <FadeUp isActive={isActive} delay={450}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Item</Text>
              <Text style={styles.receiptValue}>{data.purchase.merchantName}</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Date</Text>
              <Text style={styles.receiptValue}>{formattedDate}</Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Category</Text>
              <Text style={styles.receiptValue}>
                {data.purchase.category.charAt(0).toUpperCase() + data.purchase.category.slice(1)}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Amount</Text>
              <Text style={[styles.receiptValue, { color: accent, fontFamily: 'Syne_700Bold' }]}>
                ${Math.round(data.purchase.amount).toLocaleString()}
              </Text>
            </View>
          </View>
        </FadeUp>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120,
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
    marginBottom: 12,
  },
  headline: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 24,
  },
  receiptCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    width: '100%',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  receiptValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stinger: {
    position: 'absolute',
    bottom: 60,
    left: -5,
    fontFamily: 'Syne_800ExtraBold',
    fontSize: SCREEN_WIDTH * 0.52,
    opacity: 0.06,
    zIndex: 1,
  },
});
