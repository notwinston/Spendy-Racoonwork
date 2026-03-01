import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/constants';

type TabIconName = 'grid' | 'calendar' | 'locate' | 'trophy' | 'bulb';
type TabIconOutline = 'grid-outline' | 'calendar-outline' | 'locate-outline' | 'trophy-outline' | 'bulb-outline';

const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconOutline }> = {
  dashboard: { active: 'grid', inactive: 'grid-outline' },
  calendar: { active: 'calendar', inactive: 'calendar-outline' },
  plan: { active: 'locate', inactive: 'locate-outline' },
  arena: { active: 'trophy', inactive: 'trophy-outline' },
  insights: { active: 'bulb', inactive: 'bulb-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: Typography.sizes.xs,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
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
