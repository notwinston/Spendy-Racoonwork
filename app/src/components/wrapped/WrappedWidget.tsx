import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function WrappedWidget() {
  const router = useRouter();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = lastMonth.toLocaleString('en-US', { month: 'long' });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/wrapped')}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#1e4a08', '#4a8020']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.title}>{monthName} Flashback</Text>
        <Text style={styles.sub}>Tap to view ›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 20,
    color: '#C8F135',
  },
  sub: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
