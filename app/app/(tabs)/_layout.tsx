import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Typography } from '../../src/constants';

type TabIconName = 'home' | 'calendar' | 'compass' | 'trophy' | 'stats-chart';
type TabIconOutline = 'home-outline' | 'calendar-outline' | 'compass-outline' | 'trophy-outline' | 'stats-chart-outline';

const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconOutline }> = {
  dashboard: { active: 'home', inactive: 'home-outline' },
  calendar: { active: 'calendar', inactive: 'calendar-outline' },
  plan: { active: 'compass', inactive: 'compass-outline' },
  arena: { active: 'trophy', inactive: 'trophy-outline' },
  insights: { active: 'stats-chart', inactive: 'stats-chart-outline' },
};

const TAB_ORDER = ['dashboard', 'calendar', 'plan', 'arena', 'insights'];

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons = TAB_ICONS[name];
  if (!icons) return null;
  const iconName = focused ? icons.active : icons.inactive;
  const color = focused ? '#00D09C' : Colors.tabInactive;

  const scale = useSharedValue(focused ? 1.15 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 18, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.iconWrapper, animatedStyle, focused && styles.iconGlow]}>
      <Ionicons name={iconName} size={22} color={color} />
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const indicatorX = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const numTabs = state.routes.length;
  const indicatorWidth = 48;

  const activeIndex = state.index;

  useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = containerWidth / numTabs;
      const targetX = activeIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
      indicatorX.value = withSpring(targetX, { damping: 18, stiffness: 200 });
    }
  }, [activeIndex, containerWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (containerWidth === 0) {
      // First layout — snap without animation
      const tabWidth = width / numTabs;
      indicatorX.value = activeIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
    }
    setContainerWidth(width);
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]} onLayout={handleLayout}>
      {/* Top glow line */}
      <LinearGradient
        colors={['transparent', Colors.glassBorderLight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.glowLine}
      />
      {/* Active indicator pill */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon name={route.name} focused={isFocused} />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? '#00D09C' : Colors.tabInactive },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar' }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Plan' }}
      />
      <Tabs.Screen
        name="arena"
        options={{ title: 'Arena' }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'Insights' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.glassBg,
    position: 'relative',
  },
  glowLine: {
    height: 1,
    width: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    top: 9,
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 208, 156, 0.15)',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    shadowColor: Colors.glowTeal,
    shadowRadius: 10,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
});
